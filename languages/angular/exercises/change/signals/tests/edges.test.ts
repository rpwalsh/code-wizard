// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The minimality guarantees — nothing re-runs without a reason. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { computed, effect, renderTemplate, signal } from '../main.ts';

test(
  'an equal write wakes nobody',
  () => {
    const count = signal(1);
    let runs = 0;
    effect(() => {
      runs += 1;
      count.get();
    });

    count.set(1);
    expectEqual(runs, 1);
  },
  { concept: 'angular.change.detection' },
);

test(
  'a computed is lazy until first read',
  () => {
    const count = signal(1);
    let runs = 0;
    const lazy = computed(() => {
      runs += 1;
      return count.get();
    });

    expectEqual(runs, 0);
    lazy.get();
    expectEqual(runs, 1);
  },
  { concept: 'angular.change.detection' },
);

test(
  'a stopped effect never runs again',
  () => {
    const count = signal(1);
    let runs = 0;
    const { stop } = effect(() => {
      runs += 1;
      count.get();
    });

    stop();
    count.set(2);
    count.set(3);
    expectEqual(runs, 1);
  },
  { concept: 'angular.change.detection' },
);

test(
  'dependencies re-track: an unread branch stops waking the reader',
  () => {
    const useDetail = signal(false);
    const summary = signal('short');
    const detail = signal('long');
    let runs = 0;

    const view = computed(() => {
      runs += 1;
      return useDetail.get() ? detail.get() : summary.get();
    });

    expectEqual(view.get(), 'short');
    expectEqual(runs, 1);

    // While the detail branch is unread, changing it must wake nothing.
    detail.set('longer');
    expectEqual(view.get(), 'short');
    expectEqual(runs, 1);

    useDetail.set(true);
    expectEqual(view.get(), 'longer');
    expectEqual(runs, 2);
  },
  { concept: 'angular.change.detection' },
);

test(
  'computeds chain',
  () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2);
    const labeled = computed(() => `value: ${doubled.get()}`);

    expectEqual(labeled.get(), 'value: 2');
    count.set(3);
    expectEqual(labeled.get(), 'value: 6');
  },
  { concept: 'angular.change.signals' },
);

test(
  'a template with an unknown key throws by name',
  () => {
    let message = '';
    try {
      renderTemplate('{{missing}}', {});
    } catch (error) {
      message = (error as Error).message;
    }
    expectTrue(message.includes('missing'));
  },
  { concept: 'angular.components.template' },
);
