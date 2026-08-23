// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Cleanup ordering, unmount, and the object-literal trap. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { EffectScheduler, depsChanged } from '../main.js';

test(
  'cleanup runs before the next effect, in order',
  () => {
    const scheduler = new EffectScheduler();
    const effect = () => () => undefined;

    scheduler.render([1]);
    scheduler.run(effect);
    scheduler.render([2]);
    scheduler.run(effect);

    expectEqual(scheduler.log, ['effect', 'cleanup', 'effect']);
  },
  { concept: 'react.effects.cleanup' },
);

test(
  'unmount runs the final cleanup exactly once',
  () => {
    const scheduler = new EffectScheduler();
    let cleanups = 0;

    scheduler.render([]);
    scheduler.run(() => () => {
      cleanups += 1;
    });
    scheduler.unmount();
    scheduler.unmount();

    expectEqual(cleanups, 1);
    expectEqual(scheduler.log, ['effect', 'cleanup']);
  },
  { concept: 'react.effects.cleanup' },
);

test(
  'an effect with no cleanup unmounts silently',
  () => {
    const scheduler = new EffectScheduler();
    scheduler.render([]);
    scheduler.run(() => undefined);
    scheduler.unmount();
    expectEqual(scheduler.log, ['effect']);
  },
  { concept: 'react.effects.cleanup' },
);

test(
  'a fresh object literal defeats the comparison',
  () => {
    // { id: 1 } is a new reference each time — Object.is says changed,
    // which is the "my effect runs every render" bug in one line.
    expectTrue(depsChanged([{ id: 1 }], [{ id: 1 }]));

    const stable = { id: 1 };
    expectEqual(depsChanged([stable], [stable]), false);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'NaN does not loop an effect forever',
  () => {
    // Object.is(NaN, NaN) is true; === would re-run on every render.
    expectEqual(depsChanged([NaN], [NaN]), false);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'run without a due effect does nothing',
  () => {
    const scheduler = new EffectScheduler();
    scheduler.render([]);
    scheduler.run(() => undefined);
    // Same deps: not due — run must not fire the effect again.
    scheduler.render([]);
    scheduler.run(() => undefined);
    expectEqual(scheduler.log, ['effect']);
  },
  { concept: 'react.effects.useeffect' },
);
