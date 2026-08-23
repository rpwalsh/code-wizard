// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Sorting items into named buckets.
 *
 * Items start in a holding area and are dragged into a column, or clicked and
 * then clicked into one. Anything still in the holding area when the answer is
 * checked counts as wrong, which is the honest reading: "I did not place this"
 * is not a correct placement.
 *
 * Each item is judged on its own, so the review after the answer marks the one
 * that moved to the wrong column rather than reddening the whole exercise.
 */
import type { CategorizeActivity } from '@code-retrainer/activities';

import { usePlacement } from './use-placement.ts';

const UNPLACED = '__unplaced';

export function Categorize({
  activity,
  placed,
  locked,
  parts,
  onChange,
}: {
  readonly activity: CategorizeActivity;
  readonly placed: readonly string[];
  readonly locked: boolean;
  /** Per-item correctness, once the answer is in. */
  readonly parts: readonly boolean[] | null;
  readonly onChange: (placed: readonly string[]) => void;
}) {
  const place = (item: string, target: string): void => {
    const index = Number(item);
    if (!Number.isInteger(index)) return;
    const next = [...placed];
    while (next.length < activity.items.length) next.push('');
    next[index] = target === UNPLACED ? '' : target;
    onChange(next);
  };

  const placement = usePlacement(place, !locked);

  const itemsIn = (bucket: string): readonly number[] =>
    activity.items
      .map((_, index) => index)
      .filter((index) => (placed[index] ?? '') === (bucket === UNPLACED ? '' : bucket));

  const chip = (index: number) => {
    const item = activity.items[index];
    if (!item) return null;
    const verdict = parts?.[index];
    return (
      <li key={item.text}>
        <button
          type="button"
          className="chip"
          disabled={locked}
          aria-pressed={placement.active === String(index) && placement.held}
          data-active={placement.active === String(index)}
          data-verdict={verdict === undefined ? undefined : verdict ? 'right' : 'wrong'}
          {...placement.source(String(index))}
        >
          {item.text}
        </button>
      </li>
    );
  };

  return (
    <div className="sorter">
      <div
        className="sorter__pool"
        data-drop-id={UNPLACED}
        data-over={placement.over === UNPLACED}
        onClick={() => placement.placeInto(UNPLACED)}
      >
        <p className="label">
          {placement.held ? 'Now choose a column' : 'Drag these, or click one then a column'}
        </p>
        <ul className="sorter__chips">{itemsIn(UNPLACED).map(chip)}</ul>
      </div>

      <div className="sorter__buckets">
        {activity.buckets.map((bucket) => (
          <div
            key={bucket.id}
            className="sorter__bucket"
            data-drop-id={bucket.id}
            data-over={placement.over === bucket.id}
            onClick={() => placement.placeInto(bucket.id)}
          >
            <p className="sorter__bucket-name">{bucket.name}</p>
            {bucket.hint ? <p className="sorter__bucket-hint">{bucket.hint}</p> : null}
            <ul className="sorter__chips">{itemsIn(bucket.id).map(chip)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}
