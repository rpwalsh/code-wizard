import type { Constraint, SkillMap, SkillNode } from '@forge/session';
import { useState } from 'react';

import { SkillDag } from '../components/SkillDag.tsx';

interface SkillMapViewProps {
  readonly map: SkillMap;
  readonly constraintsFor: (skillId: string) => readonly Constraint[];
  readonly exerciseCountFor: (skillId: string) => number;
  readonly onPractise: (skillId: string) => void;
}

/**
 * The curriculum as a landscape you can explore.
 *
 * The graph carries the structure; the inspector answers what to do about it.
 * Together they let a learner go from "state modelling is weak" to "state
 * modelling is weak *because* dictionary mutation is, and here is an exercise
 * for that" without reading a single list.
 */
export function SkillMapView({
  map,
  constraintsFor,
  exerciseCountFor,
  onPractise,
}: SkillMapViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const node = map.nodes.find((candidate) => candidate.skillId === selected) ?? null;

  const measured = map.nodes.filter((entry) => !entry.unmeasured).length;
  const due = map.nodes.filter(
    (entry) => entry.dueAt !== null && Date.parse(entry.dueAt) <= Date.now(),
  ).length;

  return (
    <div className="map">
      <div className="map__main">
        <div className="section__head">
          <p className="label">Skill map</p>
          <p className="label">
            {measured} / {map.nodes.length} measured
            {due > 0 ? ` · ${due} due` : ''}
          </p>
        </div>

        <SkillDag map={map} selected={selected} onSelect={setSelected} />
      </div>

      {node ? (
        <Inspector
          node={node}
          constraints={constraintsFor(node.skillId)}
          exerciseCount={exerciseCountFor(node.skillId)}
          onPractise={() => onPractise(node.skillId)}
          onClear={() => setSelected(null)}
        />
      ) : (
        <aside className="inspector">
          <p className="label">Inspector</p>
          <p className="empty">
            Select a skill to see how it is measured, when it is next due, and which of the things
            it rests on are holding it back.
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
  onClear,
}: {
  readonly node: SkillNode;
  readonly constraints: readonly Constraint[];
  readonly exerciseCount: number;
  readonly onPractise: () => void;
  readonly onClear: () => void;
}) {
  return (
    <aside className="inspector" aria-live="polite">
      <div className="inspector__head">
        <div>
          <p className="label">{node.category}</p>
          <h2 className="inspector__name">{node.name}</h2>
        </div>
        <button
          type="button"
          className="button button--bare"
          onClick={onClear}
          aria-label="Clear selection"
        >
          ✕
        </button>
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
          <ul className="constraint-list">
            {constraints.map((constraint) => (
              <li key={constraint.skillId} className="constraint">
                <span>{constraint.name}</span>
                <span className="fact__value">
                  {constraint.unmeasured ? 'untested' : `${Math.round(constraint.mastery * 100)}%`}
                </span>
              </li>
            ))}
          </ul>
          <p className="empty">
            {node.name} rests on these. Strengthening the weakest first is usually faster than
            attacking {node.name} directly.
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
