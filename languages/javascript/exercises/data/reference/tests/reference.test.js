// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue, expectFalse } from 'retrainer/expect.js';

import { addBadge, sameRoster, scoreboard, uniqueTags, withScore } from '../main.js';

const ada = () => ({ name: 'Ada', score: 10, badges: ['first'], tags: ['math', 'logic'] });
const bo = () => ({ name: 'Bo', score: 7, badges: [], tags: ['logic', 'art'] });

test(
  'withScore replaces the score and keeps the rest',
  () => {
    const updated = withScore(ada(), 25);
    expectEqual(updated.score, 25);
    expectEqual(updated.name, 'Ada');
    expectEqual(updated.badges, ['first']);
  },
  { concept: 'javascript.data.reference' },
);

test(
  'addBadge appends to the copy',
  () => {
    expectEqual(addBadge(ada(), 'streak').badges, ['first', 'streak']);
  },
  { concept: 'javascript.data.reference' },
);

test(
  'tags come back once each, in first-seen order',
  () => {
    expectEqual(uniqueTags([ada(), bo()]), ['math', 'logic', 'art']);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'the scoreboard maps names to scores',
  () => {
    const scores = scoreboard([ada(), bo()]);
    expectEqual(scores.get('Ada'), 10);
    expectEqual(scores.get('Bo'), 7);
    expectEqual(scores.size, 2);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'a roster is the same players in any order',
  () => {
    const one = ada();
    const two = bo();
    expectTrue(sameRoster([one, two], [two, one]));
    expectFalse(sameRoster([one], [two]));
  },
  { concept: 'javascript.data.reference' },
);
