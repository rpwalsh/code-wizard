// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { connect, firstAndLast, splitUser } from '../main.js';

test(
  'defaults fill in what the caller left out',
  () => {
    expectEqual(connect({ host: 'db.example' }), 'pg://db.example:5432');
  },
  { concept: 'javascript.data.destructuring' },
);

test(
  'explicit options are used',
  () => {
    expectEqual(
      connect({ host: 'db.example', port: 6543, secure: true }),
      'pg://db.example:6543+tls',
    );
  },
  { concept: 'javascript.data.destructuring' },
);

test(
  'a user splits into name, contact and the rest',
  () => {
    const user = {
      name: 'Ada',
      contact: { email: 'ada@example.com', phone: '555-0100' },
      role: 'admin',
      active: true,
    };

    expectEqual(splitUser(user), {
      name: 'Ada',
      contact: 'ada@example.com <555-0100>',
      rest: { role: 'admin', active: true },
    });
  },
  { concept: 'javascript.data.destructuring' },
);

test(
  'first, last and count come back together',
  () => {
    expectEqual(firstAndLast(['a', 'b', 'c']), { first: 'a', last: 'c', count: 3 });
  },
  { concept: 'javascript.data.objects' },
);
