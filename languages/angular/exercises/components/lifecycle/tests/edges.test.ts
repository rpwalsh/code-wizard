// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Optional hooks, unchanged inputs, and life after destroy. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { ComponentHarness } from '../main.ts';

test(
  'a component with no hooks is driven without error',
  () => {
    const harness = new ComponentHarness({});
    harness.setInput('x', 1);
    harness.detectChanges();
    harness.destroy();
    expectEqual(harness.log, []);
  },
  { concept: 'angular.components.lifecycle' },
);

test(
  'setting an input to its current value fires nothing',
  () => {
    const harness = new ComponentHarness({ ngOnChanges: () => undefined, ngOnInit: () => undefined });
    harness.setInput('name', 'Ada');
    harness.detectChanges();

    harness.setInput('name', 'Ada');
    harness.detectChanges();

    expectEqual(harness.log, ['ngOnChanges', 'ngOnInit']);
  },
  { concept: 'angular.components.inputs' },
);

test(
  'init still fires when no inputs were ever staged',
  () => {
    const harness = new ComponentHarness({ ngOnInit: () => undefined, ngOnChanges: () => undefined });
    harness.detectChanges();
    // No inputs changed, so no ngOnChanges — but the component still initializes.
    expectEqual(harness.log, ['ngOnInit']);
  },
  { concept: 'angular.components.lifecycle' },
);

test(
  'destroy runs once and later destroys are silent',
  () => {
    const harness = new ComponentHarness({ ngOnDestroy: () => undefined });
    harness.detectChanges();
    harness.destroy();
    harness.destroy();
    expectEqual(harness.log, ['ngOnDestroy']);
  },
  { concept: 'angular.testing.harness' },
);

test(
  'a destroyed view refuses detection',
  () => {
    const harness = new ComponentHarness({});
    harness.destroy();

    let threw = false;
    try {
      harness.detectChanges();
    } catch {
      threw = true;
    }
    expectTrue(threw);
  },
  { concept: 'angular.testing.harness' },
);

test(
  'several staged inputs arrive as one change record',
  () => {
    let count = 0;
    const harness = new ComponentHarness({
      ngOnChanges: (changes) => {
        count = Object.keys(changes).length;
      },
    });
    harness.setInput('a', 1);
    harness.setInput('b', 2);
    harness.detectChanges();
    expectEqual(count, 2);
    expectEqual(harness.log, ['ngOnChanges']);
  },
  { concept: 'angular.components.inputs' },
);
