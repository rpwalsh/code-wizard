// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary providers. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { Injector } from '../main.ts';

test(
  'a value provider returns its value',
  () => {
    const injector = new Injector();
    injector.provideValue('api.url', 'https://example.test');
    expectEqual(injector.resolve('api.url'), 'https://example.test');
  },
  { concept: 'angular.di.providers' },
);

test(
  'a factory runs once and is cached',
  () => {
    const injector = new Injector();
    let built = 0;
    injector.provideFactory('service', () => {
      built += 1;
      return `instance ${built}`;
    });

    expectEqual(built, 0);
    expectEqual(injector.resolve('service'), 'instance 1');
    expectEqual(injector.resolve('service'), 'instance 1');
    expectEqual(built, 1);
  },
  { concept: 'angular.di.providers' },
);

test(
  'multi providers accumulate in order',
  () => {
    const injector = new Injector();
    injector.provideMulti('interceptors', 'auth');
    injector.provideMulti('interceptors', 'logging');
    injector.provideMulti('interceptors', 'retry');
    expectEqual(injector.resolve('interceptors'), ['auth', 'logging', 'retry']);
  },
  { concept: 'angular.di.tokens' },
);

test(
  'an unknown token throws by name',
  () => {
    const injector = new Injector();
    let message = '';
    try {
      injector.resolve('missing.service');
    } catch (error) {
      message = (error as Error).message;
    }
    expectTrue(message.includes('missing.service'));
  },
  { concept: 'angular.di.tokens' },
);

test(
  'has answers without constructing',
  () => {
    const injector = new Injector();
    let built = false;
    injector.provideFactory('lazy', () => {
      built = true;
      return 'x';
    });

    expectTrue(injector.has('lazy'));
    expectEqual(injector.has('other'), false);
    expectEqual(built, false);
  },
  { concept: 'angular.di.providers' },
);
