// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary pipeline. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { Client, authInterceptor, buildUrl, retryInterceptor, withHeader } from '../main.ts';

test(
  'urls join with exactly one slash',
  () => {
    expectEqual(buildUrl('https://api.test/', '/users', {}), 'https://api.test/users');
    expectEqual(buildUrl('https://api.test', 'users', {}), 'https://api.test/users');
  },
  { concept: 'angular.http.client' },
);

test(
  'query parameters are appended encoded',
  () => {
    expectEqual(
      buildUrl('https://api.test', '/search', { q: 'c++ jobs', page: '2' }),
      'https://api.test/search?q=c%2B%2B%20jobs&page=2',
    );
  },
  { concept: 'angular.http.client' },
);

test(
  'the auth interceptor stamps every request',
  () => {
    const client = new Client(
      (request) => ({ status: 200, body: request.headers['authorization'] ?? 'none' }),
      [authInterceptor('t0ken')],
    );
    expectEqual(client.get('/data').body, 'Bearer t0ken');
  },
  { concept: 'angular.http.interceptors' },
);

test(
  'retry answers with the second try after a 503',
  () => {
    let calls = 0;
    const client = new Client(
      () => {
        calls += 1;
        return calls === 1 ? { status: 503, body: 'unavailable' } : { status: 200, body: 'ok' };
      },
      [retryInterceptor],
    );

    expectEqual(client.get('/flaky'), { status: 200, body: 'ok' });
    expectEqual(calls, 2);
  },
  { concept: 'angular.http.interceptors' },
);

test(
  'a healthy response is not retried',
  () => {
    let calls = 0;
    const client = new Client(
      () => {
        calls += 1;
        return { status: 200, body: 'fine' };
      },
      [retryInterceptor],
    );
    client.get('/steady');
    expectEqual(calls, 1);
  },
  { concept: 'angular.http.interceptors' },
);
