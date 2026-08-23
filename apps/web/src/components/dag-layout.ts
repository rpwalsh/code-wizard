// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillMap } from '@code-retrainer/session';

export interface LaidOutNode {
  readonly skillId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LaidOutEdge {
  readonly from: string;
  readonly to: string;
  /** SVG path made only of horizontal and vertical segments. */
  readonly path: string;
  /** `far` when the edge crosses bands and should be drawn back. */
  readonly span: 'near' | 'far';
}

/** A category band, labeled at the left like a tech tree's building row. */
export interface LaidOutBand {
  readonly category: string;
  readonly y: number;
  readonly height: number;
}

export interface DagLayout {
  readonly nodes: readonly LaidOutNode[];
  readonly edges: readonly LaidOutEdge[];
  readonly bands: readonly LaidOutBand[];
  readonly width: number;
  readonly height: number;
}

export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 40;

const COLUMN_GAP = 22;
const ROW_GAP = 18;
const BAND_GAP = 30;
const LABEL_WIDTH = 116;
const MARGIN_X = 16;
const MARGIN_Y = 16;
const MIN_COLUMNS = 3;

/**
 * The skill graph as a tech tree.
 *
 * Laid out the way an Age of Empires tree is: **each category is a horizontal
 * band**, labeled down the left, and **progression runs left to right** along
 * it. That orientation is not cosmetic, it is the only one that fits.
 * Categories as columns needs ten lanes side by side, which cannot be shown at
 * a readable size on any screen without sideways scrolling — and a map you
 * have to scroll sideways to read is a map nobody reads.
 *
 * Within a band a skill sits to the right of everything in that band it rests
 * on, so following one row left to right is following one branch from its
 * beginning. A band wider than the canvas wraps onto another row rather than
 * pushing the picture sideways, so the whole thing stays inside the width and
 * grows downward instead — the direction a page is allowed to grow.
 *
 * Edges are right angles and nothing else. A dependency is not a flow, and
 * ninety curves read as weather rather than as structure.
 *
 * Deterministic, so the map is a place a learner builds a memory of rather
 * than a fresh arrangement every visit.
 */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

const DEFAULT_VIEWPORT: Viewport = { width: 1040, height: 760 };

export function layoutDag(map: SkillMap, viewport: Viewport = DEFAULT_VIEWPORT): DagLayout {
  if (map.nodes.length === 0) {
    return { nodes: [], edges: [], bands: [], width: 0, height: 0 };
  }

  const categories = orderBands(map);
  const ordered = orderWithinBands(map, categories);

  return place(ordered, categories, chooseColumns(ordered, viewport), map);
}

/**
 * How many skills to put in a row before wrapping.
 *
 * Not derived from the width alone, because the thing being fitted is a
 * rectangle in both directions: too few columns and the tree is a tall ribbon
 * with empty space either side, too many and it is a wide strip with empty
 * space above and below. Either way the fit scale collapses and the labels stop
 * being words.
 *
 * So try every count and keep the one that lets the whole tree be drawn
 * largest. It is a dozen candidates over a graph of a few hundred nodes, which
 * costs nothing and removes an entire class of guessing.
 */
function chooseColumns(
  ordered: ReadonlyMap<string, readonly string[]>,
  viewport: Viewport,
): number {
  const widest = Math.max(...[...ordered.values()].map((members) => members.length));
  let best = MIN_COLUMNS;
  let bestScale = -1;

  for (let columns = MIN_COLUMNS; columns <= Math.max(MIN_COLUMNS, widest); columns += 1) {
    const size = measure(ordered, columns);
    const scale = Math.min(1, Math.min(viewport.width / size.width, viewport.height / size.height));
    // `>` and not `>=`: on a tie prefer fewer columns, so a band that fits on
    // one row is never split just to square the picture off.
    if (scale > bestScale) {
      bestScale = scale;
      best = columns;
    }
  }

  return best;
}

function measure(
  ordered: ReadonlyMap<string, readonly string[]>,
  columns: number,
): { width: number; height: number } {
  let height = MARGIN_Y * 2;
  let widest = 0;

  for (const members of ordered.values()) {
    if (members.length === 0) continue;
    const rows = Math.ceil(members.length / columns);
    height += rows * NODE_HEIGHT + (rows - 1) * ROW_GAP + BAND_GAP;
    widest = Math.max(widest, Math.min(members.length, columns));
  }

  return {
    width: MARGIN_X * 2 + LABEL_WIDTH + widest * (NODE_WIDTH + COLUMN_GAP) - COLUMN_GAP,
    height: height - BAND_GAP,
  };
}

function place(
  ordered: ReadonlyMap<string, readonly string[]>,
  categories: readonly string[],
  columns: number,
  map: SkillMap,
): DagLayout {
  const bands: LaidOutBand[] = [];
  const laidOutNodes: LaidOutNode[] = [];
  let cursorY = MARGIN_Y;

  for (const category of categories) {
    const members = ordered.get(category) ?? [];
    if (members.length === 0) continue;

    const rows = Math.ceil(members.length / columns);
    const height = rows * NODE_HEIGHT + (rows - 1) * ROW_GAP;

    members.forEach((skillId, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      laidOutNodes.push({
        skillId,
        x: MARGIN_X + LABEL_WIDTH + column * (NODE_WIDTH + COLUMN_GAP),
        y: cursorY + row * (NODE_HEIGHT + ROW_GAP),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });

    bands.push({ category, y: cursorY, height });
    cursorY += height + BAND_GAP;
  }

  const positions = new Map(laidOutNodes.map((node) => [node.skillId, node]));
  const outgoing = new Map<string, number>();

  const edges = [...map.edges].sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
  );

  const laidOutEdges: LaidOutEdge[] = [];
  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;

    const index = outgoing.get(edge.from) ?? 0;
    outgoing.set(edge.from, index + 1);

    const sameRow = Math.abs(from.y - to.y) < 1;
    const near = sameRow && to.x > from.x;
    laidOutEdges.push({
      from: edge.from,
      to: edge.to,
      span: near ? 'near' : 'far',
      path: near ? straight(from, to) : routed(from, to, index, columns),
    });
  }

  const size = measure(ordered, columns);
  return { nodes: laidOutNodes, edges: laidOutEdges, bands, ...size };
}

/**
 * A step along a row: out of one box, straight into the next.
 *
 * The commonest edge on the map and the cheapest to read, because it is a
 * single segment at eye level with nothing to trace.
 */
function straight(from: LaidOutNode, to: LaidOutNode): string {
  const y = round(from.y + from.height / 2);
  return `M${round(from.x + from.width)} ${y} L${round(to.x)} ${y}`;
}

/**
 * Every other edge, routed through the empty space rather than over the boxes.
 *
 * Two thirds of this graph's dependencies cross from one branch into another —
 * recursion into algorithms, collections into data structures — and those are
 * the edges worth seeing, not the ones to hide. The reason they read as noise
 * is not that there are many of them, it is that a straight drop from one box
 * to another eight rows below passes *through* everything in between, so the
 * picture fills with lines that appear to touch skills they have nothing to do
 * with.
 *
 * So they are bussed. The layout puts every band on the same column grid,
 * which means the gaps between columns are unbroken vertical corridors running
 * the full height of the map, and the gaps between rows are unbroken
 * horizontal ones. An edge leaves the bottom of its source into the row gap,
 * runs sideways to the nearest corridor, drops down it, and comes back along
 * the row gap above its target. Six segments, all right angles, and not one of
 * them crosses a box.
 */
function routed(from: LaidOutNode, to: LaidOutNode, index: number, columns: number): string {
  const downward = to.y >= from.y;
  const startX = round(from.x + from.width / 2);
  const endX = round(to.x + to.width / 2);
  const startY = downward ? from.y + from.height : from.y;
  const endY = downward ? to.y : to.y + to.height;

  // Nothing in between and no sideways travel: the direct drop is already
  // clear, and bussing it would be ceremony.
  const clearance = downward ? to.y - (from.y + from.height) : from.y - (to.y + to.height);
  if (Math.abs(startX - endX) < 1 && clearance <= BAND_GAP + 1) {
    return `M${startX} ${round(startY)} L${endX} ${round(endY)}`;
  }

  // Stack the horizontal runs inside the gap so several edges sharing it stay
  // three distinct lines rather than one thick one.
  const step = (index % 3) * 4;
  const exitY = round(startY + (downward ? 6 + step : -6 - step));
  const entryY = round(endY - (downward ? 6 + step : -6 - step));
  const corridor = round(nearestCorridor((startX + endX) / 2, columns) + ((index % 3) - 1) * 4);

  return [
    `M${startX} ${round(startY)}`,
    `L${startX} ${exitY}`,
    `L${corridor} ${exitY}`,
    `L${corridor} ${entryY}`,
    `L${endX} ${entryY}`,
    `L${endX} ${round(endY)}`,
  ].join(' ');
}

/**
 * The vertical corridor nearest a point.
 *
 * Corridors sit in the gaps between columns, plus one to the left of the first
 * column, so an edge never has to travel far to find one.
 */
function nearestCorridor(x: number, columns: number): number {
  const first = MARGIN_X + LABEL_WIDTH - COLUMN_GAP / 2;
  const pitch = NODE_WIDTH + COLUMN_GAP;
  const index = clamp(Math.round((x - first) / pitch), 0, columns);
  return first + index * pitch;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

/**
 * Band order: the order a learner meets each category.
 *
 * Earliest first, by the shallowest skill in it, so reading top to bottom
 * roughly follows the course.
 */
function orderBands(map: SkillMap): string[] {
  const firstDepth = new Map<string, number>();
  for (const node of map.nodes) {
    const seen = firstDepth.get(node.category);
    if (seen === undefined || node.depth < seen) firstDepth.set(node.category, node.depth);
  }
  return [...firstDepth.keys()].sort(
    (a, b) => (firstDepth.get(a) ?? 0) - (firstDepth.get(b) ?? 0) || a.localeCompare(b),
  );
}

/**
 * Within a band, dependencies first.
 *
 * Ordering by depth puts every skill to the right of anything in its own band
 * that it rests on, which is what makes a row read as a progression rather
 * than as a set.
 */
function orderWithinBands(map: SkillMap, categories: readonly string[]): Map<string, string[]> {
  const byCategory = new Map<string, string[]>();

  for (const category of categories) {
    byCategory.set(
      category,
      map.nodes
        .filter((node) => node.category === category)
        .sort((a, b) => a.depth - b.depth || a.skillId.localeCompare(b.skillId))
        .map((node) => node.skillId),
    );
  }

  return byCategory;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Everything `skillId` rests on, and everything resting on it.
 *
 * Selecting a node dims the rest of the graph to these two sets, which turns
 * the map from a picture into an answer: this is the chain you would have to
 * fix, and this is what improving it would unlock.
 */
export function relatives(
  map: SkillMap,
  skillId: string,
): { ancestors: Set<string>; descendants: Set<string> } {
  const upward = new Map<string, string[]>();
  const downward = new Map<string, string[]>();

  for (const edge of map.edges) {
    upward.set(edge.to, [...(upward.get(edge.to) ?? []), edge.from]);
    downward.set(edge.from, [...(downward.get(edge.from) ?? []), edge.to]);
  }

  return {
    ancestors: walk(upward, skillId),
    descendants: walk(downward, skillId),
  };
}

function walk(adjacency: ReadonlyMap<string, string[]>, start: string): Set<string> {
  const seen = new Set<string>();
  const queue = [...(adjacency.get(start) ?? [])];

  while (queue.length > 0) {
    const next = queue.shift();
    if (next === undefined || seen.has(next)) continue;
    seen.add(next);
    queue.push(...(adjacency.get(next) ?? []));
  }

  return seen;
}
