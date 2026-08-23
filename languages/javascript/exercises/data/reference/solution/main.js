// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * References, copies that go exactly one level deep, and the containers
 * that deal in identity.
 */

export function withScore(player, score) {
  return { ...player, score };
}

export function addBadge(player, badge) {
  // The inner spread is the point: without it the copy shares the original's
  // array, and appending grows both.
  return { ...player, badges: [...player.badges, badge] };
}

export function uniqueTags(players) {
  // A Set keeps first-insertion order, which is the order asked for.
  const seen = new Set();
  for (const player of players) {
    for (const tag of player.tags) {
      seen.add(tag);
    }
  }
  return [...seen];
}

export function scoreboard(players) {
  // A Map has no inherited keys: a player named "constructor" is just a key.
  const scores = new Map();
  for (const player of players) {
    scores.set(player.name, player.score);
  }
  return scores;
}

export function sameRoster(left, right) {
  if (left.length !== right.length) return false;

  // Map keys are reference identity — exactly the roster question. Counting
  // matters: a Set would let one duplicated reference stand in for two
  // different players.
  const counts = new Map();
  for (const player of right) {
    counts.set(player, (counts.get(player) ?? 0) + 1);
  }

  for (const player of left) {
    const remaining = counts.get(player) ?? 0;
    if (remaining === 0) return false;
    counts.set(player, remaining - 1);
  }
  return true;
}
