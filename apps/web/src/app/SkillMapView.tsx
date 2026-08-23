// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Constraint, SkillMap, SkillNode } from '@code-retrainer/session';
import { useMemo, useState } from 'react';

import { SkillDag } from '../components/SkillDag.tsx';

interface SkillMapViewProps {
  readonly map: SkillMap;
  /** The app-wide language; the map shows this one's graph. */
  readonly language: string;
  readonly constraintsFor: (skillId: string) => readonly Constraint[];
  readonly exerciseCountFor: (skillId: string) => number;
  readonly onPractice: (skillId: string) => void;
  /** Start a demonstration: the claim "I know this", put to a test. */
  readonly onDemonstrate: (skillId: string) => void;
  /** False when nothing unseen is left to test the claim against. */
  readonly canDemonstrate: (skillId: string) => boolean;
}

/**
 * The curriculum as a landscape you can explore.
 *
 * The graph carries the structure; the inspector answers what to do about it.
 * Together they let a learner go from "state modeling is weak" to "state
 * modeling is weak *because* dictionary mutation is, and here is an exercise
 * for that" without reading a single list.
 */
export function SkillMapView({
  map,
  language,
  constraintsFor,
  exerciseCountFor,
  onPractice,
  onDemonstrate,
  canDemonstrate,
}: SkillMapViewProps) {
  /*
   * One language at a time.
   *
   * The browser build now carries six, and merging them produced a map of a
   * hundred and ninety-one nodes in which Python's "Syntax" band sat beside
   * JavaScript's — same label, unrelated skills, no edge between them. It was
   * unreadable, and half of it was off-screen at any fit that kept the labels
   * legible.
   *
   * Languages share no prerequisites by construction, so a combined graph is
   * six disconnected graphs drawn on top of each other. Showing one is not a
   * simplification; it is the only view that is a graph at all.
   */
  const languages = useMemo(
    () => [...new Set(map.nodes.map((entry) => entry.skillId.split('.')[0] ?? ''))].sort(),
    [map],
  );
  // Controlled by the app-wide selector. No silent substitution: a language
  // whose graph is not in this build gets an honest empty state, not another
  // language's map wearing its name.
  const shown = languages.includes(language) ? language : null;

  const visible = useMemo<SkillMap>(() => {
    if (shown === null) return { ...map, nodes: [], edges: [] };
    const kept = new Set(
      map.nodes.filter((entry) => entry.skillId.startsWith(`${shown}.`)).map((e) => e.skillId),
    );
    return {
      ...map,
      nodes: map.nodes.filter((entry) => kept.has(entry.skillId)),
      edges: map.edges.filter((edge) => kept.has(edge.from) && kept.has(edge.to)),
    };
  }, [map, shown]);

  const [selected, setSelected] = useState<string | null>(null);
  const node = visible.nodes.find((candidate) => candidate.skillId === selected) ?? null;

  const measured = visible.nodes.filter((entry) => !entry.unmeasured).length;
  const due = visible.nodes.filter(
    (entry) => entry.dueAt !== null && Date.parse(entry.dueAt) <= Date.now(),
  ).length;

  return (
    <div className="map">
      <div className="map__main">
        <div className="section__head">
          <p className="label">Skill map</p>

          {/* The language is the top bar's dropdown; repeating a picker here
              would be two controls fighting over one choice. */}
          <p className="label">
            {measured} / {visible.nodes.length} measured
            {due > 0 ? ` · ${due} due` : ''}
          </p>
        </div>

        {shown === null ? (
          <p className="empty" style={{ margin: 24 }}>
            This build has no skill graph for that language yet — its exercises live in the
            desktop app. The Practice tab has its activities, and the graph arrives with the
            exercises.
          </p>
        ) : (
          <SkillDag map={visible} selected={selected} onSelect={setSelected} />
        )}
      </div>

      {node ? (
        <Inspector
          node={node}
          constraints={constraintsFor(node.skillId)}
          exerciseCount={exerciseCountFor(node.skillId)}
          onPractice={() => onPractice(node.skillId)}
          onDemonstrate={() => onDemonstrate(node.skillId)}
          canDemonstrate={canDemonstrate(node.skillId)}
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
  onPractice,
  onDemonstrate,
  canDemonstrate,
  onClear,
}: {
  readonly node: SkillNode;
  readonly constraints: readonly Constraint[];
  readonly exerciseCount: number;
  readonly onPractice: () => void;
  readonly onDemonstrate: () => void;
  readonly canDemonstrate: boolean;
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
        <Fact label="Last practiced" value={relative(node.lastPracticedAt)} />
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
        onClick={onPractice}
      >
        {exerciseCount === 0 ? 'No exercises yet' : 'Practice this'}
      </button>

      {canDemonstrate ? (
        <>
          <button type="button" className="button" onClick={onDemonstrate}>
            I know this — skip it
          </button>
          {/*
            Stated plainly, because the offer is worthless if the learner
            thinks it is a trap. It is not a test they can fail into anything:
            the only thing at stake is the shortcut they asked for.
          */}
          <p className="empty">
            One exercise you have not seen, blank page, no hints. Pass it and this skill and
            everything under it are credited. Fail it and nothing happens.
          </p>
        </>
      ) : null}
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
