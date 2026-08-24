// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: empty selections, absent keys, and the caller's object. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { countBy, indexBy, omit, pick, renameKey } from '../main.ts';

type User = { id: number; name: string; team: string; admin: boolean };

const ada: User = { id: 1, name: 'ada', team: 'core', admin: true };

test(
  'picking nothing gives an empty object, not the whole thing',
  () => {
    expectEqual(pick(ada, []), {});
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'omitting nothing gives a copy of everything',
  () => {
    const copy = omit(ada, []);
    expectEqual(copy, { id: 1, name: 'ada', team: 'core', admin: true });
    // A copy, though: the caller's object must not be handed back.
    expectTrue(copy !== (ada as object));
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'a falsy value survives being picked',
  () => {
    // `admin: false` is a value. A pick written with a truthiness test
    // drops it, and the result is a different shape from the one promised.
    const bo: User = { id: 2, name: 'bo', team: 'core', admin: false };
    const flags = pick(bo, ['admin']);
    expectEqual('admin' in flags, true);
    expectEqual(flags.admin, false);

    // And an id of zero, which the same mistake would also lose.
    const zero = pick({ id: 0, name: 'origin' }, ['id']);
    expectEqual('id' in zero, true);
    expectEqual(zero.id, 0);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'a key the object does not carry is left out rather than set to undefined',
  () => {
    // Optional properties genuinely go missing at runtime, and a result
    // with `nickname: undefined` is a different object from one without.
    type Partial = { id: number; nickname?: string };
    const record: Partial = { id: 7 };
    const chosen = pick(record, ['id', 'nickname']);

    expectEqual('nickname' in chosen, false);
    expectEqual(chosen, { id: 7 });
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'neither pick nor omit modifies the source',
  () => {
    const source: User = { id: 1, name: 'ada', team: 'core', admin: true };
    pick(source, ['id']);
    omit(source, ['team']);
    renameKey(source, 'team', 'squad');

    expectEqual(source, { id: 1, name: 'ada', team: 'core', admin: true });
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'indexBy on an empty list is an empty map',
  () => {
    expectEqual(indexBy([] as User[], 'id').size, 0);
    expectEqual(countBy([] as User[], 'team').size, 0);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'countBy distinguishes values a plain object would merge',
  () => {
    // 1 and '1' are one key in an object and two in a Map, which is why
    // the return type is a Map rather than Record<string, number>.
    type Row = { code: number | string };
    const rows: Row[] = [{ code: 1 }, { code: '1' }, { code: 1 }];
    const counts = countBy(rows, 'code');

    expectEqual(counts.get(1), 2);
    expectEqual(counts.get('1'), 1);
    expectEqual(counts.size, 2);
  },
  { concept: 'typescript.types.utility' },
);

test(
  'renameKey keeps a falsy value intact',
  () => {
    const renamed = renameKey(ada, 'admin', 'isAdmin');
    expectEqual(renamed.isAdmin, true);

    const plain = renameKey({ id: 1, admin: false }, 'admin', 'isAdmin');
    expectEqual('isAdmin' in plain, true);
    expectEqual(plain.isAdmin, false);
  },
  { concept: 'typescript.types.utility' },
);

test(
  'renaming to a name that already exists overwrites it',
  () => {
    // Not an error, and worth pinning: the spread puts the new key last.
    const record = { a: 1, b: 2 };
    const renamed = renameKey(record, 'a', 'b');
    expectEqual(renamed.b, 1);
  },
  { concept: 'typescript.types.utility' },
);
