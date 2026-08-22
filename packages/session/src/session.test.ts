import { headlineMastery, makeMastery, SkillGraph } from '@forge/core';
import type { Exercise } from '@forge/exercises';
import { ExerciseCatalog } from '@forge/exercises';
import type { ProgressStore } from '@forge/storage';
import { MemoryProgressStore } from '@forge/storage';
import { beforeEach, describe, expect, it } from 'vitest';

import { ExerciseSession } from './exercise-session.ts';
import { ProgressService, summariseAttempts } from './progress-service.ts';
import { fakeRuntime, type FakeRuntime } from './testing/fake-runtime.ts';

const skillGraph = SkillGraph.from([
  {
    id: 'python.dict',
    name: 'Dictionaries',
    category: 'Collections',
    prerequisites: [],
    language: 'python',
  },
  {
    id: 'python.dict-lookup',
    name: 'Safe dictionary lookup',
    category: 'Collections',
    prerequisites: ['python.dict'],
    language: 'python',
  },
]);

const exercise: Exercise = {
  id: 'python.demo.lookup',
  version: 1,
  language: 'python',
  title: 'Safe lookup',
  kind: 'micro-problem',
  difficulty: 2,
  estimatedSeconds: 180,
  skills: ['python.dict-lookup'],
  prerequisites: ['python.dict'],
  learningObjectives: ['Do it'],
  prompt: 'Implement it.',
  starter: {
    files: [{ path: 'main.py', contents: 'STUB' }],
    entryPoint: 'main.py',
  },
  solution: { files: [{ path: 'main.py', contents: 'SOLVED' }], entryPoint: 'main.py' },
  tests: [
    { path: 'tests/test_a.py', visibility: 'visible', contents: 'visible source' },
    { path: 'tests/test_h.py', visibility: 'hidden', contents: 'hidden source' },
  ],
  hints: [
    { level: 'conceptual', text: 'Think about missing keys.' },
    { level: 'syntax', text: 'dict.get(key, default)' },
    { level: 'explicit', text: 'return accounts.get(id, 0)' },
  ],
  source: { directory: '/tmp/demo' },
};

let store: ProgressStore;
let runtime: FakeRuntime;
let tick: number;

function clock(): Date {
  // Each call advances 30s, so durations are deterministic and non-zero.
  tick += 30_000;
  return new Date(Date.parse('2026-03-01T10:00:00.000Z') + tick);
}

function begin(mode: Parameters<typeof ExerciseSession.begin>[1] = 'practice'): ExerciseSession {
  return ExerciseSession.begin(exercise, mode, {
    runtime,
    store,
    skillGraph,
    clock,
    newId: () => 'attempt-1',
  });
}

beforeEach(() => {
  store = new MemoryProgressStore();
  runtime = fakeRuntime();
  tick = 0;
});

describe('editing', () => {
  it('starts from the exercise starter files', () => {
    const session = begin();
    const main = session.state.files.find((file) => file.path === 'main.py');
    expect(main?.contents).toBe('STUB');
    expect(main?.readOnly).toBe(false);
  });

  it('shows visible test sources but never hidden ones', () => {
    const paths = begin().state.files.map((file) => file.path);
    expect(paths).toContain('tests/test_a.py');
    expect(paths).not.toContain('tests/test_h.py');
  });

  it('shows no test sources at all in simulation mode', () => {
    const paths = begin('simulation').state.files.map((file) => file.path);
    expect(paths).toEqual(['main.py']);
  });

  it('refuses to edit a read-only file', () => {
    expect(() => begin().updateFile('tests/test_a.py', 'tampered')).toThrow(/not editable/);
  });

  it('returns the same state object until something changes', () => {
    const session = begin();
    // The contract an identity-comparing observer relies on. Rebuilding the
    // snapshot per read makes every read look like a change, which is an
    // infinite render loop in any subscriber that compares by identity.
    expect(session.state).toBe(session.state);

    const before = session.state;
    session.updateFile('main.py', 'edited');
    expect(session.state).not.toBe(before);
    expect(session.state).toBe(session.state);
  });

  it('gives subscribers the new state, not the one being replaced', () => {
    const session = begin();
    let seen: string | undefined;
    session.subscribe((state) => {
      seen = state.files.find((file) => file.path === 'main.py')?.contents;
    });
    session.updateFile('main.py', 'edited');
    expect(seen).toBe('edited');
  });

  it('notifies subscribers when a file changes', () => {
    const session = begin();
    let notified = 0;
    session.subscribe(() => (notified += 1));
    session.updateFile('main.py', 'edited');
    expect(notified).toBe(1);
  });

  it('does not notify when the contents are unchanged', () => {
    const session = begin();
    let notified = 0;
    session.subscribe(() => (notified += 1));
    session.updateFile('main.py', 'STUB');
    expect(notified).toBe(0);
  });

  it('sends the edited files to the runtime, not the starter', async () => {
    const session = begin();
    session.updateFile('main.py', 'SOLVED');
    await session.run();
    expect(runtime.lastExecuteWorkspace?.files.find((f) => f.path === 'main.py')?.contents).toBe(
      'SOLVED',
    );
  });

  it('can be reset back to the starter code', () => {
    const session = begin();
    session.updateFile('main.py', 'scribbles');
    session.resetFiles();
    expect(session.state.files.find((file) => file.path === 'main.py')?.contents).toBe('STUB');
  });
});

describe('running and testing', () => {
  it('records a run and exposes its result', async () => {
    const session = begin();
    const result = await session.run();
    expect(result.outcome).toBe('completed');
    expect(session.state.lastRun).toBe(result);
    expect(session.attempt.events.filter((event) => event.type === 'run')).toHaveLength(1);
  });

  it('reports activity while working', async () => {
    const session = begin();
    const seen: string[] = [];
    session.subscribe((state) => seen.push(state.activity));
    await session.run();
    expect(seen).toContain('running');
    expect(session.state.activity).toBe('idle');
  });

  it('refuses to start a second run while one is in flight', async () => {
    const session = begin();
    const first = session.run();
    await expect(session.run()).rejects.toThrow(/already in progress/);
    await first;
  });

  it('stays unsolved while the tests are red', async () => {
    const session = begin();
    await session.runTests();
    expect(session.state.solved).toBe(false);
    expect(session.state.completion).toBeNull();
  });

  it('persists an in-progress attempt so a crash does not lose it', async () => {
    const session = begin();
    await session.runTests();
    const saved = await store.getAttempt('attempt-1');
    expect(saved?.outcome).toBe('in-progress');
    expect(saved?.events).toHaveLength(1);
  });

  it('saves the learner code alongside the attempt', async () => {
    const session = begin();
    session.updateFile('main.py', 'work in progress');
    await session.runTests();
    expect((await store.getAttempt('attempt-1'))?.finalFiles).toEqual({
      'main.py': 'work in progress',
    });
  });
});

describe('hints', () => {
  it('reveals hints one at a time, in ladder order', async () => {
    const session = begin();
    expect((await session.revealNextHint())?.level).toBe('conceptual');
    expect((await session.revealNextHint())?.level).toBe('syntax');
    expect(session.state.revealedHints).toHaveLength(2);
    expect(session.state.remainingHints).toBe(1);
  });

  it('returns null once the ladder is exhausted', async () => {
    const session = begin();
    for (let index = 0; index < exercise.hints.length; index += 1) await session.revealNextHint();
    expect(await session.revealNextHint()).toBeNull();
  });

  it('refuses hints in fluency mode', async () => {
    const session = begin('fluency');
    expect(session.state.hintsAllowed).toBe(false);
    await expect(session.revealNextHint()).rejects.toThrow(/disabled in fluency mode/);
  });

  it('refuses documentation in simulation mode', async () => {
    await expect(begin('simulation').lookUpDocumentation('dict.get')).rejects.toThrow(
      /closed in simulation mode/,
    );
  });

  it('records a documentation lookup as assistance', async () => {
    const session = begin();
    await session.lookUpDocumentation('dict.get');
    expect(session.attempt.events.some((event) => event.type === 'documentation')).toBe(true);
  });
});

describe('completing an exercise', () => {
  async function solve(session: ExerciseSession) {
    session.updateFile('main.py', 'SOLVED');
    runtime.green = true;
    return session.runTests();
  }

  it('marks the attempt solved and reports what changed', async () => {
    const session = begin();
    await solve(session);

    const completion = session.state.completion;
    expect(session.state.solved).toBe(true);
    expect(completion?.solved).toBe(true);
    expect(completion?.independent).toBe(true);
    expect(completion?.changes.length).toBeGreaterThan(0);
    expect(completion?.reasons.join(' ')).toMatch(/Solved the exercise/);
  });

  it('moves mastery for every skill the exercise trains', async () => {
    await solve(begin());
    const mastery = await store.getMastery('python.dict-lookup');
    expect(mastery).not.toBeNull();
    expect(headlineMastery(mastery!.vector)).toBeGreaterThan(0);
    expect(mastery!.observations).toBe(1);
  });

  it('reinforces retention on a clean recall', async () => {
    await solve(begin());
    expect((await store.getMastery('python.dict-lookup'))!.vector.retention).toBeGreaterThan(0);
  });

  it('schedules the first spaced review', async () => {
    await solve(begin());
    const review = (await store.allReviews()).get('python.dict-lookup');
    expect(review?.intervalDays).toBe(1);
    expect(review?.streak).toBe(0);
  });

  it('explains the review decision in the learner language', async () => {
    const session = begin();
    await solve(session);
    expect(session.state.completion?.reviewNotes.join(' ')).toMatch(/Safe dictionary lookup/);
  });

  it('records an assisted solve as not independent', async () => {
    const session = begin();
    await session.revealNextHint();
    await solve(session);
    expect(session.state.completion?.independent).toBe(false);
    expect(session.state.completion?.hintsUsed).toBe(1);
  });

  it('scores independence lower after an explicit hint than with none', async () => {
    const assisted = new MemoryProgressStore();
    const assistedSession = ExerciseSession.begin(exercise, 'practice', {
      runtime,
      store: assisted,
      skillGraph,
      clock,
      newId: () => 'a',
    });
    for (let index = 0; index < 3; index += 1) await assistedSession.revealNextHint();
    await solve(assistedSession);

    const clean = new MemoryProgressStore();
    runtime = fakeRuntime();
    const cleanSession = ExerciseSession.begin(exercise, 'practice', {
      runtime,
      store: clean,
      skillGraph,
      clock,
      newId: () => 'b',
    });
    await solve(cleanSession);

    const assistedMastery = (await assisted.getMastery('python.dict-lookup'))!;
    const cleanMastery = (await clean.getMastery('python.dict-lookup'))!;
    expect(cleanMastery.vector.independence).toBeGreaterThan(assistedMastery.vector.independence);
    expect(cleanMastery.vector.recall).toBeGreaterThan(assistedMastery.vector.recall);
  });

  it('grades an abandoned attempt that at least ran the tests', async () => {
    const session = begin();
    await session.runTests();
    const completion = await session.abandon();
    expect(completion?.solved).toBe(false);
    expect((await store.getAttempt('attempt-1'))?.outcome).toBe('abandoned');
  });

  it('does not grade an attempt that never ran anything', async () => {
    const session = begin();
    const completion = await session.abandon();
    expect(completion?.changes).toEqual([]);
    expect(await store.getMastery('python.dict-lookup')).toBeNull();
  });

  it('refuses to reveal the solution in practice mode', async () => {
    await expect(begin('practice').revealSolution()).rejects.toThrow(/cannot be revealed/);
  });

  it('gives a revealed solution no effect on mastery', async () => {
    const session = begin('learn');
    await session.revealSolution();
    await solve(session);
    const mastery = await store.getMastery('python.dict-lookup');
    expect(headlineMastery(mastery!.vector)).toBe(0);
  });
});

describe('ProgressService', () => {
  it('summarises attempts into what the recommender needs', async () => {
    const session = begin();
    session.updateFile('main.py', 'SOLVED');
    runtime.green = true;
    await session.runTests();

    const summaries = summariseAttempts(await store.allAttempts());
    const summary = summaries.get('python.demo.lookup');
    expect(summary?.attempts).toBe(1);
    expect(summary?.solvedAttempts).toBe(1);
    expect(summary?.lastWasIndependent).toBe(true);
    expect(summary?.recentFailures).toBe(0);
  });

  it('counts failures only since the last success', async () => {
    const attempts = await store.allAttempts();
    expect(summariseAttempts(attempts).size).toBe(0);
  });

  it('builds a dashboard from stored progress', async () => {
    const session = begin();
    session.updateFile('main.py', 'SOLVED');
    runtime.green = true;
    await session.runTests();

    const service = new ProgressService(store, new ExerciseCatalog([exercise]), skillGraph);
    const dashboard = await service.dashboard(new Date('2026-03-03T10:00:00.000Z'));

    expect(dashboard.totalAttempts).toBe(1);
    expect(dashboard.independentCompletion).toBe(1);
    // Practised on the 1st, first review due on the 2nd, so by the 3rd it is due.
    expect(dashboard.dueCount).toBe(1);
  });

  it('does not list unpractised skills as weaknesses', async () => {
    const service = new ProgressService(store, new ExerciseCatalog([exercise]), skillGraph);
    await store.saveMastery({
      skillId: 'python.dict',
      vector: (await store.getMastery('python.dict'))?.vector ?? emptyVector(),
      observations: 0,
      lastPracticedAt: null,
    });
    const dashboard = await service.dashboard();
    // Never attempted is unexplored, not weak; listing it buries real losses.
    expect(dashboard.weaknesses).toHaveLength(0);
  });
});

function emptyVector() {
  return makeMastery({});
}
