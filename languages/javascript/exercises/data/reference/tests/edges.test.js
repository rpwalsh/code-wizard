// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The shallow-copy trap and the keys objects cannot be trusted with. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue, expectFalse } from 'retrainer/expect.js';

import { addBadge, sameRoster, scoreboard, withScore } from '../main.js';

test(
  'the original survives withScore untouched',
  () => {
    const player = { name: 'Ada', score: 10, badges: [], tags: [] };
    withScore(player, 99);
    expectEqual(player.score, 10);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  "addBadge must not grow the original's array",
  () => {
    // A spread without the inner array copy shares badges and fails here.
    const player = { name: 'Ada', score: 10, badges: ['first'], tags: [] };
    addBadge(player, 'streak');
    expectEqual(player.badges, ['first']);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'a player may be named constructor',
  () => {
    // Object property lookup would find Object.prototype.constructor here.
    const scores = scoreboard([{ name: 'constructor', score: 3, badges: [], tags: [] }]);
    expectEqual(scores.get('constructor'), 3);
    expectEqual(scores.get('toString'), undefined);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'equal contents are not the same player',
  () => {
    const original = { name: 'Ada', score: 10, badges: [], tags: [] };
    const lookalike = { name: 'Ada', score: 10, badges: [], tags: [] };
    expectFalse(sameRoster([original], [lookalike]));
    expectTrue(sameRoster([original], [original]));
  },
  { concept: 'javascript.data.reference' },
);

test(
  'a duplicated reference on one side needs a duplicate on the other',
  () => {
    const player = { name: 'Ada', score: 10, badges: [], tags: [] };
    const other = { name: 'Bo', score: 7, badges: [], tags: [] };
    // Exactly false, not merely falsy: a missing return is not an answer.
    expectEqual(sameRoster([player, player], [player, other]), false);
  },
  { concept: 'javascript.data.reference' },
);

test(
  'rosters of different sizes are different rosters',
  () => {
    const player = { name: 'Ada', score: 10, badges: [], tags: [] };
    expectEqual(sameRoster([player], []), false);
    expectEqual(sameRoster([], [player]), false);
  },
  { concept: 'javascript.data.reference' },
);
