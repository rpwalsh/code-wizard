// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The promised order, kept. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { ComponentHarness, buildChanges, type SimpleChanges } from '../main.ts';

test(
  'changes fire before init on the first detection',
  () => {
    const calls: string[] = [];
    const harness = new ComponentHarness({
      ngOnChanges: () => calls.push('changes'),
      ngOnInit: () => calls.push('init'),
    });

    harness.setInput('name', 'Ada');
    harness.detectChanges();

    expectEqual(calls, ['changes', 'init']);
  },
  { concept: 'angular.components.lifecycle' },
);

test(
  'init fires once, changes fire again',
  () => {
    const harness = new ComponentHarness({
      ngOnChanges: () => undefined,
      ngOnInit: () => undefined,
    });

    harness.setInput('name', 'Ada');
    harness.detectChanges();
    harness.setInput('name', 'Bo');
    harness.detectChanges();

    expectEqual(harness.log, ['ngOnChanges', 'ngOnInit', 'ngOnChanges']);
  },
  { concept: 'angular.components.lifecycle' },
);

test(
  'the first change record says firstChange',
  () => {
    let seen: SimpleChanges | null = null;
    const harness = new ComponentHarness({
      ngOnChanges: (changes) => {
        seen = changes;
      },
    });

    harness.setInput('name', 'Ada');
    harness.detectChanges();

    expectTrue(seen !== null);
    expectEqual(seen, {
      name: { previousValue: undefined, currentValue: 'Ada', firstChange: true },
    });
  },
  { concept: 'angular.components.inputs' },
);

test(
  'the hook reads the new value off the component itself',
  () => {
    let observed: unknown = null;
    const component = {
      name: undefined as string | undefined,
      ngOnChanges() {
        observed = this.name;
      },
    };
    const harness = new ComponentHarness(component);
    harness.setInput('name', 'Ada');
    harness.detectChanges();
    expectEqual(observed, 'Ada');
  },
  { concept: 'angular.components.inputs' },
);

test(
  'buildChanges records only what changed',
  () => {
    const changes = buildChanges({ a: 1, b: 2 }, { a: 1, b: 3 }, false);
    expectEqual(changes, { b: { previousValue: 2, currentValue: 3, firstChange: false } });
  },
  { concept: 'angular.components.inputs' },
);
