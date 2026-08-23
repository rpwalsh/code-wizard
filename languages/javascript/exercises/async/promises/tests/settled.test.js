// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { fetchAll, fetchSettled } from '../main.js';

const later = (value, ms = 1) =>
  () => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const failing = (reason, ms = 1) =>
  () => new Promise((resolve, reject) => setTimeout(() => reject(new Error(reason)), ms));

test(
  'fetchAll returns every result in input order',
  async () => {
    // The slow one comes first in the input, so order here proves ordering
    // is by input, not completion.
    expectEqual(await fetchAll([later('slow', 20), later('fast', 1)]), ['slow', 'fast']);
  },
  { concept: 'javascript.async.promises' },
);

test(
  'fetchAll rejects when any task rejects',
  async () => {
    let caught = null;
    try {
      await fetchAll([later('fine'), failing('boom')]);
    } catch (error) {
      caught = error;
    }
    expectTrue(caught instanceof Error && caught.message === 'boom');
  },
  { concept: 'javascript.async.errors' },
);

test(
  'fetchSettled keeps the successes alongside the failure',
  async () => {
    const results = await fetchSettled([later('a'), failing('boom'), later('c')]);
    expectEqual(results.length, 3);
    expectEqual(results[0], { ok: true, value: 'a' });
    expectEqual(results[1].ok, false);
    expectEqual(results[1].reason.message, 'boom');
    expectEqual(results[2], { ok: true, value: 'c' });
  },
  { concept: 'javascript.async.promises' },
);

test(
  'fetchSettled never rejects, even when everything fails',
  async () => {
    const results = await fetchSettled([failing('one'), failing('two')]);
    expectEqual(results.map((result) => result.ok), [false, false]);
  },
  { concept: 'javascript.async.errors' },
);
