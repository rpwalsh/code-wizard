// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The three rules, exercised one at a time. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue, expectFalse } from 'retrainer/expect.js';

import { EffectScheduler, depsChanged, describeDeps } from '../main.js';

test(
  'the first render always counts as changed',
  () => {
    expectTrue(depsChanged(undefined, []));
    expectTrue(depsChanged(undefined, [1]));
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'equal slots mean unchanged',
  () => {
    expectFalse(depsChanged([1, 'a'], [1, 'a']));
    expectTrue(depsChanged([1, 'a'], [2, 'a']));
    expectTrue(depsChanged([1], [1, 2]));
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'an empty array runs the effect once',
  () => {
    const scheduler = new EffectScheduler();
    const effect = () => undefined;

    scheduler.render([]);
    scheduler.run(effect);
    scheduler.render([]);
    scheduler.run(effect);
    scheduler.render([]);
    scheduler.run(effect);

    expectEqual(scheduler.log, ['effect']);
  },
  { concept: 'react.effects.useeffect' },
);

test(
  'no array runs the effect every render',
  () => {
    const scheduler = new EffectScheduler();
    const effect = () => undefined;

    scheduler.render(undefined);
    scheduler.run(effect);
    scheduler.render(undefined);
    scheduler.run(effect);

    expectEqual(scheduler.log, ['effect', 'effect']);
  },
  { concept: 'react.effects.useeffect' },
);

test(
  'a changed dep re-runs; an unchanged one does not',
  () => {
    const scheduler = new EffectScheduler();
    const effect = () => undefined;

    scheduler.render(['a']);
    scheduler.run(effect);
    scheduler.render(['a']);
    scheduler.run(effect);
    scheduler.render(['b']);
    scheduler.run(effect);

    expectEqual(scheduler.log, ['effect', 'effect']);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'the three descriptions',
  () => {
    expectEqual(describeDeps(undefined), 'every render');
    expectEqual(describeDeps([]), 'once');
    expectEqual(describeDeps([1]), 'when deps change');
  },
  { concept: 'react.effects.dependencies' },
);
