// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Overrides, falsy instances, and the mix that must not happen. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { Injector } from '../main.ts';

test(
  'the last registration wins — which is what test overrides are',
  () => {
    const injector = new Injector();
    injector.provideValue('clock', 'real');
    injector.provideValue('clock', 'fake');
    expectEqual(injector.resolve('clock'), 'fake');
  },
  { concept: 'angular.di.providers' },
);

test(
  'a factory returning false is still cached',
  () => {
    const injector = new Injector();
    let runs = 0;
    injector.provideFactory('flag', () => {
      runs += 1;
      return false;
    });

    expectEqual(injector.resolve('flag'), false);
    expectEqual(injector.resolve('flag'), false);
    // A truthiness-based cache would run the factory every time.
    expectEqual(runs, 1);
  },
  { concept: 'angular.di.providers' },
);

test(
  'mixing multi onto a plain token throws at registration',
  () => {
    const injector = new Injector();
    injector.provideValue('config', 'plain');
    let threw = false;
    try {
      injector.provideMulti('config', 'extra');
    } catch {
      threw = true;
    }
    expectTrue(threw);
  },
  { concept: 'angular.di.tokens' },
);

test(
  'mixing plain onto a multi token throws too',
  () => {
    const injector = new Injector();
    injector.provideMulti('validators', 'required');
    let threw = false;
    try {
      injector.provideValue('validators', 'single');
    } catch {
      threw = true;
    }
    expectTrue(threw);
  },
  { concept: 'angular.di.tokens' },
);

test(
  'mutating a resolved multi array does not touch the registry',
  () => {
    const injector = new Injector();
    injector.provideMulti('items', 'a');

    const resolved = injector.resolve('items') as string[];
    resolved.push('mutated');

    expectEqual(injector.resolve('items'), ['a']);
  },
  { concept: 'angular.di.tokens' },
);
