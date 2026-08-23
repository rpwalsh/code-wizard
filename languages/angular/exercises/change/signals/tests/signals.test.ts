// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary reactive graph. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { computed, effect, renderTemplate, signal } from '../main.ts';

test(
  'a signal holds and replaces its value',
  () => {
    const count = signal(1);
    expectEqual(count.get(), 1);
    count.set(2);
    expectEqual(count.get(), 2);
  },
  { concept: 'angular.change.signals' },
);

test(
  'a computed follows its dependency',
  () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    expectEqual(doubled.get(), 4);
    count.set(5);
    expectEqual(doubled.get(), 10);
  },
  { concept: 'angular.change.signals' },
);

test(
  'a computed caches between changes',
  () => {
    const count = signal(1);
    let runs = 0;
    const tracked = computed(() => {
      runs += 1;
      return count.get();
    });

    tracked.get();
    tracked.get();
    tracked.get();
    expectEqual(runs, 1);

    count.set(2);
    tracked.get();
    expectEqual(runs, 2);
  },
  { concept: 'angular.change.detection' },
);

test(
  'an effect runs now and after each change',
  () => {
    const name = signal('Ada');
    const seen: string[] = [];
    effect(() => seen.push(name.get()));

    name.set('Bo');
    name.set('Cy');
    expectEqual(seen, ['Ada', 'Bo', 'Cy']);
  },
  { concept: 'angular.change.signals' },
);

test(
  'a template interpolates its signals',
  () => {
    const name = signal('Ada');
    const count = signal(3);
    expectEqual(
      renderTemplate('Hello, {{name}}! You have {{count}} messages.', { name, count }),
      'Hello, Ada! You have 3 messages.',
    );
  },
  { concept: 'angular.components.template' },
);
