// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Assembling a hierarchy by hanging nodes off other nodes.
 *
 * The tree is always shown as it currently stands, including the parts that
 * are wrong, because the whole subject is shape — a diagram that only appeared
 * once it was correct would withhold the one thing being taught.
 *
 * Unplaced nodes wait in a holding area. Dropping a node onto another makes it
 * a child; dropping it on the root makes it a top-level branch.
 *
 * A node cannot be dropped into its own subtree. That is not a rule the
 * learner should have to discover through a broken diagram: a cycle is not a
 * wrong answer, it is not a tree at all, so the move is simply refused.
 */
import type { BuildTreeActivity } from '@code-retrainer/activities';

import { usePlacement } from './use-placement.ts';

const ROOT = '__root';
const LOOSE = '__loose';

export function BuildTree({
  activity,
  parents,
  locked,
  parts,
  onChange,
}: {
  readonly activity: BuildTreeActivity;
  /** Parallel to `activity.nodes`. `undefined` means not yet placed. */
  readonly parents: readonly (string | null | undefined)[];
  readonly locked: boolean;
  readonly parts: readonly boolean[] | null;
  readonly onChange: (parents: readonly (string | null | undefined)[]) => void;
}) {
  const indexOf = (id: string): number => activity.nodes.findIndex((node) => node.id === id);

  /** Would making `child` a descendant of `parent` close a loop? */
  const wouldCycle = (child: string, parent: string | null): boolean => {
    let current = parent;
    let steps = 0;
    while (current !== null && current !== undefined && steps <= activity.nodes.length) {
      if (current === child) return true;
      current = parents[indexOf(current)] ?? null;
      steps += 1;
    }
    return false;
  };

  const place = (item: string, target: string): void => {
    const index = indexOf(item);
    if (index < 0) return;

    const parent = target === ROOT ? null : target === LOOSE ? undefined : target;
    if (parent === item) return;
    if (typeof parent === 'string' && wouldCycle(item, parent)) return;

    const next = [...parents];
    while (next.length < activity.nodes.length) next.push(undefined);
    next[index] = parent;
    onChange(next);
  };

  const placement = usePlacement(place, !locked);

  const childrenOf = (parent: string | null): readonly number[] =>
    activity.nodes
      .map((_, index) => index)
      .filter((index) => parents[index] !== undefined && (parents[index] ?? null) === parent);

  const loose = activity.nodes
    .map((_, index) => index)
    .filter((index) => parents[index] === undefined);

  const nodeChip = (index: number) => {
    const node = activity.nodes[index];
    if (!node) return null;
    const verdict = parts?.[index];
    return (
      <button
        type="button"
        className="chip"
        disabled={locked}
        aria-pressed={placement.active === node.id && placement.held}
        data-active={placement.active === node.id}
        data-verdict={verdict === undefined ? undefined : verdict ? 'right' : 'wrong'}
        {...placement.source(node.id)}
      >
        {node.label}
      </button>
    );
  };

  const branch = (parent: string | null) => {
    const children = childrenOf(parent);
    if (children.length === 0) return null;
    return (
      <ul className="tree__list">
        {children.map((index) => {
          const node = activity.nodes[index];
          if (!node) return null;
          return (
            <li key={node.id}>
              <span
                className="tree__node"
                data-drop-id={node.id}
                data-over={placement.over === node.id}
                onClick={() => placement.placeInto(node.id)}
              >
                {nodeChip(index)}
              </span>
              {branch(node.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="tree">
      <div
        className="tree__loose"
        data-drop-id={LOOSE}
        data-over={placement.over === LOOSE}
        onClick={() => placement.placeInto(LOOSE)}
      >
        <p className="label">
          {placement.held ? 'Now choose where it goes' : 'Drag onto the tree, or click then click'}
        </p>
        <div className="tree__chips">{loose.map(nodeChip)}</div>
      </div>

      <div className="tree__canvas">
        <span
          className="tree__node tree__node--root"
          data-drop-id={ROOT}
          data-over={placement.over === ROOT}
          onClick={() => placement.placeInto(ROOT)}
        >
          {activity.root}
        </span>
        {branch(null)}
      </div>
    </div>
  );
}
