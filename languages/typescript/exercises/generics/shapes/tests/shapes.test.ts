// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: choosing, dropping, indexing and counting. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { countBy, indexBy, omit, pick, renameKey } from '../main.ts';

type User = { id: number; name: string; team: string; admin: boolean };

const users: User[] = [
  { id: 1, name: 'ada', team: 'core', admin: true },
  { id: 2, name: 'bo', team: 'core', admin: false },
  { id: 3, name: 'cy', team: 'infra', admin: false },
];

test(
  'pick keeps only the named keys',
  () => {
    const summary = pick(users[0], ['id', 'name']);
    expectEqual(summary, { id: 1, name: 'ada' });
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'the picked value keeps its own type',
  () => {
    // `admin` comes back as a boolean, not as unknown or as string.
    const flags = pick(users[0], ['admin']);
    expectEqual(flags.admin, true);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'omit removes the named keys and leaves the rest',
  () => {
    expectEqual(omit(users[0], ['admin', 'team']), { id: 1, name: 'ada' });
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'indexBy maps each key value to its item',
  () => {
    const byId = indexBy(users, 'id');
    expectTrue(byId instanceof Map);
    expectEqual(byId.get(2)?.name, 'bo');
    expectEqual(byId.size, 3);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'indexBy keeps the last item when a key repeats',
  () => {
    const byTeam = indexBy(users, 'team');
    // Two people are on core; an index holds one record per key.
    expectEqual(byTeam.get('core')?.name, 'bo');
    expectEqual(byTeam.size, 2);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'countBy counts the items behind each value',
  () => {
    const perTeam = countBy(users, 'team');
    expectEqual(perTeam.get('core'), 2);
    expectEqual(perTeam.get('infra'), 1);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'countBy works on a boolean key as well as a string one',
  () => {
    const perRole = countBy(users, 'admin');
    // The key type is boolean, not the string 'true'.
    expectEqual(perRole.get(true), 1);
    expectEqual(perRole.get(false), 2);
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'renameKey moves a value to a new name',
  () => {
    const renamed = renameKey(users[0], 'team', 'squad');
    expectEqual(renamed.squad, 'core');
    expectEqual('team' in renamed, false);
    expectEqual(renamed.name, 'ada');
  },
  { concept: 'typescript.types.utility' },
);
