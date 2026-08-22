import dagre from '@dagrejs/dagre';
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
  /** SVG path through dagre's routing points. */
  readonly path: string;
}

export interface DagLayout {
  readonly nodes: readonly LaidOutNode[];
  readonly edges: readonly LaidOutEdge[];
  readonly width: number;
  readonly height: number;
}

export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 46;

/**
 * Lay the skill graph out as a real DAG.
 *
 * Sugiyama layering via dagre rather than a force-directed simulation: a
 * dependency graph has a direction, and a physics blob hides it. Layered
 * layout puts every prerequisite strictly above what depends on it and
 * minimises edge crossings, which is what makes tracing a chain backwards —
 * "state modelling rests on dictionary mutation rests on lookup" — something a
 * learner can do with their eyes rather than by reading a list.
 *
 * Deterministic: the same graph always produces the same picture, so the map
 * is a place the learner can build a memory of rather than a fresh arrangement
 * every visit.
 */
export function layoutDag(map: SkillMap): DagLayout {
  const graph = new dagre.graphlib.Graph({ directed: true });

  graph.setGraph({
    rankdir: 'TB',
    // Generous rank separation: the vertical gaps are what make the layers
    // legible as layers.
    ranksep: 68,
    nodesep: 22,
    edgesep: 12,
    marginx: 24,
    marginy: 24,
    // Network simplex gives the most stable ranking for graphs this size.
    ranker: 'network-simplex',
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // Sorting the input makes dagre's output stable across runs.
  const sorted = [...map.nodes].sort((a, b) => a.skillId.localeCompare(b.skillId));
  for (const node of sorted) {
    graph.setNode(node.skillId, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges = [...map.edges].sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
  );
  for (const edge of edges) {
    if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) {
      graph.setEdge(edge.from, edge.to);
    }
  }

  dagre.layout(graph);

  const laidOutNodes: LaidOutNode[] = [];
  for (const skillId of graph.nodes()) {
    const positioned = graph.node(skillId);
    if (!positioned) continue;
    laidOutNodes.push({
      skillId,
      // dagre centres nodes; SVG rects are placed from their corner.
      x: positioned.x - positioned.width / 2,
      y: positioned.y - positioned.height / 2,
      width: positioned.width,
      height: positioned.height,
    });
  }

  const laidOutEdges: LaidOutEdge[] = [];
  for (const edge of graph.edges()) {
    const routed = graph.edge(edge);
    if (!routed?.points?.length) continue;
    laidOutEdges.push({ from: edge.v, to: edge.w, path: toPath(routed.points) });
  }

  const size = graph.graph();
  return {
    nodes: laidOutNodes,
    edges: laidOutEdges,
    width: Math.ceil(size.width ?? 0),
    height: Math.ceil(size.height ?? 0),
  };
}

/**
 * A smooth curve through dagre's routing points.
 *
 * Catmull-Rom converted to cubic Béziers: it passes through every routing
 * point, so edges follow the channels dagre reserved for them instead of
 * cutting across nodes the way a naive curve would.
 */
function toPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) {
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`)
      .join(' ');
  }

  const segments: string[] = [`M${round(points[0]!.x)} ${round(points[0]!.y)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const after = points[Math.min(points.length - 1, index + 2)]!;

    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const control2 = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    };

    segments.push(
      `C${round(control1.x)} ${round(control1.y)}, ${round(control2.x)} ${round(control2.y)}, ${round(next.x)} ${round(next.y)}`,
    );
  }

  return segments.join(' ');
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
    const current = queue.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);
    queue.push(...(adjacency.get(current) ?? []));
  }

  return seen;
}
