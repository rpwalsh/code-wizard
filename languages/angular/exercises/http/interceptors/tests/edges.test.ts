// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Order, immutability, and short-circuits. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import {
  Client,
  withHeader,
  type HttpRequest,
  type Interceptor,
} from '../main.ts';

test(
  'interceptor zero is outermost',
  () => {
    const order: string[] = [];
    const tag = (name: string): Interceptor => (request, next) => {
      order.push(`${name} in`);
      const response = next(request);
      order.push(`${name} out`);
      return response;
    };

    const client = new Client(() => ({ status: 200, body: '' }), [tag('first'), tag('second')]);
    client.get('/');

    expectEqual(order, ['first in', 'second in', 'second out', 'first out']);
  },
  { concept: 'angular.http.interceptors' },
);

test(
  'withHeader builds a new request and lowercases the name',
  () => {
    const request: HttpRequest = { url: '/', method: 'GET', headers: {} };
    const stamped = withHeader(request, 'Authorization', 'Bearer x');

    expectEqual(stamped.headers, { authorization: 'Bearer x' });
    expectEqual(request.headers, {});
  },
  { concept: 'angular.http.client' },
);

test(
  'two spellings of one header are one header',
  () => {
    const request: HttpRequest = { url: '/', method: 'GET', headers: {} };
    const twice = withHeader(withHeader(request, 'Authorization', 'old'), 'authorization', 'new');
    expectEqual(twice.headers, { authorization: 'new' });
  },
  { concept: 'angular.http.client' },
);

test(
  'an interceptor that never calls next short-circuits the chain',
  () => {
    let backendCalls = 0;
    const cache: Interceptor = () => ({ status: 200, body: 'from cache' });
    const client = new Client(
      () => {
        backendCalls += 1;
        return { status: 200, body: 'from network' };
      },
      [cache],
    );

    expectEqual(client.get('/data').body, 'from cache');
    expectEqual(backendCalls, 0);
  },
  { concept: 'angular.http.interceptors' },
);

test(
  'a client with no interceptors just calls the backend',
  () => {
    const client = new Client((request) => ({ status: 200, body: request.url }), []);
    expectEqual(client.get('/plain').body, '/plain');
  },
  { concept: 'angular.http.client' },
);
