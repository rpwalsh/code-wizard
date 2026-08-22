import type { Constraint, SkillMap, SkillNode } from '@forge/session';
import { useMemo, useState } from 'react';

interface SkillMapViewProps {
  readonly map: SkillMap;
  readonly constraintsFor: (skillId: string) => readonly Constraint[];
  readonly exerciseCountFor: (skillId: string) => number;
  readonly onPractise: (skillId: string) => void;
}

/**
 * The curriculum as a landscape.
 *
 * Skills are laid out in tiers by dependency depth, so everything a skill
 * rests on sits above it and the eye can trace downward. A node's strength is
 * drawn as well as numbered: the shape of the map shows where the learner is
 * solid and where they are thin, which a list of percentages never does.
 */
export function SkillMapView({
  map,
  constraintsFor,
  exerciseCountFor,
  onPractise,
}: SkillMapViewProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const tiers = useMemo(() => {
    const grouped = new Map<number, SkillNode[]>();
    for (const node of map.nodes) {
      const bucket = grouped.get(node.depth);
      if (bucket) bucket.push(node);
      else grouped.set(node.depth, [node]);
    }
    for (const bucket of grouped.values()) {
      bucket.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b);
  }, [map]);

  const node = map.nodes.find((candidate) => candidate.skillId === selected) ?? null;

  return (
    <div className="map">
      <div className="map__canvas">
        <div className="section__head">
          <p className="label">Skill map</p>
          <p className="label">
            {map.nodes.filter((entry) => !entry.unmeasured).length} / {map.nodes.length} measured
          </p>
        </div>

        {tiers.map(([depth, nodes]) => (
          <div className="tier" key={depth}>
            <span className="tier__depth" aria-hidden="true">
              {depth}
            </span>
            <ul className="tier__nodes">
              {nodes.map((entry) => (
                <li key={entry.skillId}>
                  <button
                    type="button"
                    className={`node${entry.unmeasured ? ' node--unmeasured' : ''}${
                      isDue(entry) ? ' node--due' : ''
                    }`}
                    aria-pressed={entry.skillId === selected}
                    onClick={() => setSelected(entry.skillId === selected ? null : entry.skillId)}
                  >
                    <span className="node__name">{entry.name}</span>
                    <span className="node__value">
                      {entry.unmeasured ? '—' : Math.round(entry.mastery * 100)}
                      {isDue(entry) ? ' · due' : ''}
                    </span>
                    <span
                      className="node__strength"
                      style={{ width: `${Math.max(2, entry.mastery * 100)}%` }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="empty" style={{ marginTop: 16 }}>
          Tier numbers are dependency depth: everything a skill rests on sits above it.
        </p>
      </div>

      {node ? (
        <Inspector
          node={node}
          constraints={constraintsFor(node.skillId)}
          exerciseCount={exerciseCountFor(node.skillId)}
          onPractise={() => onPractise(node.skillId)}
        />
      ) : (
        <aside className="inspector">
          <p className="label">Inspector</p>
          <p className="empty">
            Select a skill to see how it is measured, when it is next due, and what is holding it
            back.
          </p>
        </aside>
      )}
    </div>
  );
}

function Inspector({
  node,
  constraints,
  exerciseCount,
  onPractise,
}: {
  readonly node: SkillNode;
  readonly constraints: readonly Constraint[];
  readonly exerciseCount: number;
  readonly onPractise: () => void;
}) {
  return (
    <aside className="inspector" aria-live="polite">
      <div>
        <p className="label">{node.category}</p>
        <h2 className="inspector__name">{node.name}</h2>
      </div>

      <div className="inspector__facts">
        <Fact
          label="Mastery"
          value={node.unmeasured ? 'not measured' : `${Math.round(node.mastery * 100)}%`}
        />
        <Fact label="Observations" value={String(node.observations)} />
        <Fact label="Last practised" value={relative(node.lastPracticedAt)} />
        <Fact label="Next review" value={relative(node.dueAt, true)} />
        <Fact label="Exercises" value={String(exerciseCount)} />
      </div>

      {constraints.length > 0 ? (
        <div>
          <p className="label">Constrained by</p>
          <ul className="constraint-list" style={{ marginTop: 8 }}>
            {constraints.map((constraint) => (
              <li key={constraint.skillId} className="constraint">
                <span>{constraint.name}</span>
                <span className="fact__value">
                  {constraint.unmeasured ? 'untested' : `${Math.round(constraint.mastery * 100)}%`}
                </span>
              </li>
            ))}
          </ul>
          <p className="empty" style={{ marginTop: 8 }}>
            {node.name} is limited by what it rests on. Strengthening the weakest of these first is
            usually faster than attacking {node.name} directly.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="button button--primary"
        disabled={exerciseCount === 0}
        onClick={onPractise}
      >
        {exerciseCount === 0 ? 'No exercises yet' : 'Practise this'}
      </button>
    </aside>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="fact">
      <span className="fact__key">{label}</span>
      <span className="fact__value">{value}</span>
    </div>
  );
}

function isDue(node: SkillNode): boolean {
  return node.dueAt !== null && Date.parse(node.dueAt) <= Date.now();
}

function relative(iso: string | null, future = false): string {
  if (!iso) return '—';
  const days = Math.round((Date.parse(iso) - Date.now()) / 86_400_000);

  if (future) {
    if (days <= 0) return 'due now';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
  }

  const ago = -days;
  if (ago <= 0) return 'today';
  if (ago === 1) return 'yesterday';
  return `${ago} days ago`;
}
