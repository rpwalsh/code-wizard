// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillMap, SkillNode } from '@code-retrainer/session';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { DagLayout, Viewport } from './dag-layout.ts';
import { layoutDag, NODE_HEIGHT, NODE_WIDTH, relatives } from './dag-layout.ts';

interface SkillDagProps {
  readonly map: SkillMap;
  readonly selected: string | null;
  readonly onSelect: (skillId: string | null) => void;
}

type Relation = 'none' | 'self' | 'ancestor' | 'descendant';

/**
 * The curriculum as a directed acyclic graph.
 *
 * Prerequisites flow downward, every edge is drawn along the channel the
 * layout reserved for it, and a node's strength is filled in rather than only
 * printed — so the picture shows where the learner is solid and where the
 * graph is structurally thin.
 *
 * Selecting a node is the point of the whole screen: everything it rests on
 * lights up above it, everything it unlocks lights up below, and the rest
 * recedes. That turns "state modeling: 31%" from a number into a chain you
 * can see and act on.
 */
export function SkillDag({ map, selected, onSelect }: SkillDagProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewport = useViewport(containerRef);

  const [hovered, setHovered] = useState<string | null>(null);

  const layout = useMemo<DagLayout>(() => layoutDag(map, viewport), [map, viewport]);
  const byId = useMemo(() => new Map(map.nodes.map((node) => [node.skillId, node])), [map]);

  /*
    Pointing at a skill traces it, without having to commit to selecting it.
    A hundred and thirteen edges cannot all be legible at once — no styling
    makes them so — so the map draws shape at rest and answers "connected to
    what" the instant the pointer lands on something. Selection is the same
    answer, pinned, so the inspector beside it has something to describe.
  */
  const focus = selected ?? hovered;
  const related = useMemo(() => (focus ? relatives(map, focus) : null), [map, focus]);

  const view = usePanZoom(layout, containerRef, viewport);

  const relationOf = (skillId: string): Relation => {
    if (!focus) return 'none';
    if (skillId === focus) return 'self';
    if (related?.ancestors.has(skillId)) return 'ancestor';
    if (related?.descendants.has(skillId)) return 'descendant';
    return 'none';
  };

  const edgeRelation = (from: string, to: string): Relation => {
    if (!focus || !related) return 'none';
    const upstream =
      (related.ancestors.has(from) || from === focus) &&
      (related.ancestors.has(to) || to === focus);
    if (upstream) return 'ancestor';
    const downstream =
      (related.descendants.has(from) || from === focus) &&
      (related.descendants.has(to) || to === focus);
    return downstream ? 'descendant' : 'none';
  };

  return (
    <div className="dag" ref={containerRef}>
      <div className="dag__controls">
        <button
          type="button"
          className="button button--bare"
          onClick={view.zoomOut}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="dag__zoom numeral">{Math.round(view.scale * 100)}%</span>
        <button
          type="button"
          className="button button--bare"
          onClick={view.zoomIn}
          aria-label="Zoom in"
        >
          +
        </button>
        <button type="button" className="button button--bare" onClick={view.reset}>
          Fit
        </button>
      </div>

      <svg
        className="dag__canvas"
        role="group"
        aria-label="Skill dependency graph"
        onPointerDown={view.onPointerDown}
        onPointerMove={view.onPointerMove}
        onPointerUp={view.onPointerUp}
        onWheel={view.onWheel}
        onPointerLeave={() => {
          view.onPointerUp();
          setHovered(null);
        }}
      >
        <defs>
          <marker
            id="dag-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" className="dag__arrowhead" />
          </marker>
          {/* A crossing edge is drawn quieter than a step along a branch, so
              its arrowhead has to be too, or the heads are all you see. */}
          <marker
            id="dag-arrow-crossing"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" className="dag__arrowhead dag__arrowhead--crossing" />
          </marker>
        </defs>

        <g transform={`translate(${view.offset.x} ${view.offset.y}) scale(${view.scale})`}>
          {/*
            Bands and their names. A tech tree is readable because you can see
            which row you are in without tracing anything, and the label is
            what turns a group of boxes into a branch with a name.
          */}
          {layout.bands.map((band, index) => (
            <g key={band.category}>
              <rect
                className="dag__band"
                data-alternate={index % 2 === 1}
                x={0}
                y={band.y - 7}
                width={layout.width}
                height={band.height + 14}
              />
              <text className="dag__band-label" x={12} y={band.y + band.height / 2 + 4}>
                {band.category}
              </text>
            </g>
          ))}

          {layout.edges.map((edge) => {
            const relation = edgeRelation(edge.from, edge.to);
            return (
              <path
                key={`${edge.from}->${edge.to}`}
                className="dag__edge"
                data-relation={relation}
                data-span={edge.span}
                data-dimmed={focus !== null && relation === 'none'}
                d={edge.path}
                markerEnd={`url(#dag-arrow${edge.span === 'far' ? '-crossing' : ''})`}
              />
            );
          })}

          {layout.nodes.map((placed) => {
            const node = byId.get(placed.skillId);
            if (!node) return null;
            const relation = relationOf(placed.skillId);

            return (
              <Node
                key={placed.skillId}
                node={node}
                x={placed.x}
                y={placed.y}
                relation={relation}
                dimmed={focus !== null && relation === 'none'}
                onSelect={() => onSelect(selected === node.skillId ? null : node.skillId)}
                onHover={setHovered}
              />
            );
          })}
        </g>
      </svg>

      <p className="dag__legend">
        Arrows point from a prerequisite to what depends on it. Select a skill to trace the chain
        above and below it.
      </p>
    </div>
  );
}

function Node({
  node,
  x,
  y,
  relation,
  dimmed,
  onSelect,
  onHover,
}: {
  readonly node: SkillNode;
  readonly x: number;
  readonly y: number;
  readonly relation: Relation;
  readonly dimmed: boolean;
  readonly onSelect: () => void;
  readonly onHover: (skillId: string | null) => void;
}) {
  const due = node.dueAt !== null && Date.parse(node.dueAt) <= Date.now();
  const fill = Math.max(0.02, node.mastery);

  return (
    <g
      className="dag__node"
      data-relation={relation}
      data-dimmed={dimmed}
      data-unmeasured={node.unmeasured}
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-pressed={relation === 'self'}
      aria-label={`${node.name}, ${
        node.unmeasured ? 'not measured' : `${Math.round(node.mastery * 100)} percent`
      }${due ? ', due for review' : ''}`}
      onClick={onSelect}
      onPointerEnter={() => onHover(node.skillId)}
      onPointerLeave={() => onHover(null)}
      /* Keyboard tabbing gets the same tracing as the pointer, or the map is
         only readable with a mouse. */
      onFocus={() => onHover(node.skillId)}
      onBlur={() => onHover(null)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <rect className="dag__node-body" width={NODE_WIDTH} height={NODE_HEIGHT} rx="6" />

      {/* Strength drawn as well as printed: the shape of the graph becomes readable. */}
      <rect
        className="dag__node-strength"
        x="1"
        y={NODE_HEIGHT - 3}
        width={(NODE_WIDTH - 2) * fill}
        height="2"
        rx="1"
      />

      <text className="dag__node-name" x="10" y="19">
        {truncate(node.name, 22)}
      </text>
      <text className="dag__node-value" x="10" y="34">
        {node.unmeasured ? 'not measured' : `${Math.round(node.mastery * 100)}`}
        {node.exerciseCount === 0 ? ' · no exercises' : ''}
      </text>

      {due ? <circle className="dag__node-due" cx={NODE_WIDTH - 10} cy="11" r="3" /> : null}
    </g>
  );
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

/**
 * The size of the space the tree has to live in.
 *
 * Measured rather than assumed, because the layout uses it to decide how many
 * skills go in a row: the same graph should be a wide short tree on a desktop
 * and a narrow tall one on a laptop, and neither should need scrolling
 * sideways to read. Rounded to a step so that a one-pixel resize does not
 * rearrange the whole map under the reader's hands.
 */
function useViewport(containerRef: React.RefObject<HTMLDivElement | null>): Viewport {
  const [viewport, setViewport] = useState<Viewport>({ width: 1040, height: 760 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewport((current) => {
        const next = { width: step(width), height: step(height) };
        return next.width === current.width && next.height === current.height ? current : next;
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return viewport;
}

function step(value: number): number {
  return Math.max(320, Math.round(value / 24) * 24);
}

/**
 * Pan and zoom.
 *
 * Hand-rolled rather than pulled in: it is thirty lines, and a library would
 * bring its own gesture opinions to a surface where the only interactions are
 * drag, wheel and fit.
 */
function usePanZoom(
  layout: DagLayout,
  containerRef: React.RefObject<HTMLDivElement | null>,
  viewport: Viewport,
) {
  const dragging = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const fit = useMemo(
    () => () => {
      if (layout.width === 0 || layout.height === 0) return;
      const { width, height } = viewport;
      // Never zoom past 1:1 — a small graph blown up looks broken rather than
      // impressive — and never below the point where the labels stop being
      // words. A seventy-node graph shrunk to fit is a gray smear that answers
      // no question; better to show part of it legibly and let the learner
      // pan, which is what the drag is for.
      const next = clamp(Math.min(width / layout.width, height / layout.height), MINIMUM_FIT, 1);
      setScale(next);
      setOffset({
        x: (width - layout.width * next) / 2,
        y: (height - layout.height * next) / 2,
      });
    },
    [layout, viewport],
  );

  useEffect(fit, [fit]);

  return {
    scale,
    offset,
    reset: fit,
    zoomIn: () => setScale((current) => Math.min(2, current * 1.2)),
    zoomOut: () => setScale((current) => Math.max(0.2, current / 1.2)),

    onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => {
      // Only drag from empty canvas, so clicking a node still selects it.
      if (event.target !== event.currentTarget) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragging.current = {
        x: event.clientX,
        y: event.clientY,
        originX: offset.x,
        originY: offset.y,
      };
    },

    onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => {
      const start = dragging.current;
      if (!start) return;
      setOffset({
        x: start.originX + (event.clientX - start.x),
        y: start.originY + (event.clientY - start.y),
      });
    },

    onPointerUp: () => {
      dragging.current = null;
    },

    onWheel: (event: React.WheelEvent<SVGSVGElement>) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setScale((current) =>
        Math.max(0.2, Math.min(2, current * (event.deltaY < 0 ? 1.1 : 1 / 1.1))),
      );
    },
  };
}

/**
 * The smallest scale at which a node label is still readable.
 *
 * Below roughly half size the names turn into gray bars, and an overview
 * nobody can read is not an overview.
 */
const MINIMUM_FIT = 0.55;

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}
