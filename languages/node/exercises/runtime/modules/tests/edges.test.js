// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: the empty variable, the bad number, the unknown outcome. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { classify, exitCodeFor, readConfig, resolveRelative } from '../main.js';

test(
  'an empty string is a value, not an absence',
  () => {
    // PORT= in a compose file means somebody cleared it deliberately.
    // Substituting the default hides the mistake instead of reporting it.
    const config = readConfig({ HOST: '' }, { HOST: 'localhost' });
    expectEqual(config.HOST, '');
  },
  { concept: 'node.runtime.process' },
);

test(
  'a value that is not a number is refused by name',
  () => {
    let message = '';
    try {
      readConfig({ PORT: 'eighty' }, { PORT: 80 });
    } catch (error) {
      message = error.message;
    }

    expectTrue(message.includes('PORT'));
    expectTrue(message.includes('eighty'));
  },
  { concept: 'node.runtime.process' },
);

test(
  'a boolean accepts only the two spellings it means',
  () => {
    expectEqual(readConfig({ DEBUG: 'false' }, { DEBUG: true }).DEBUG, false);

    let refused = false;
    try {
      readConfig({ DEBUG: '1' }, { DEBUG: false });
    } catch {
      refused = true;
    }
    // '1' and 'yes' look like agreement and are not the contract.
    expectTrue(refused);
  },
  { concept: 'node.runtime.process' },
);

test(
  'an empty numeric variable is refused rather than defaulted',
  () => {
    let message = '';
    try {
      readConfig({ PORT: '' }, { PORT: 80 });
    } catch (error) {
      message = error.message;
    }
    // Number('') is 0, which would make an empty PORT mean port zero.
    // Checked by message rather than by "did it throw", because an
    // unimplemented stub throws too and would pass the weaker assertion.
    expectTrue(message.includes('PORT'));
  },
  { concept: 'node.runtime.process' },
);

test(
  'variables with no default are ignored',
  () => {
    const config = readConfig({ EXTRA: 'x', HOST: 'h' }, { HOST: 'localhost' });
    expectEqual(config, { HOST: 'h' });
  },
  { concept: 'node.runtime.process' },
);

test(
  'an unrecognized outcome is still a failure',
  () => {
    // Anything that is not success must not exit zero. A default of 0 tells
    // every script that ran this that everything went fine.
    expectEqual(exitCodeFor('something-else'), 1);
    expectEqual(exitCodeFor(''), 1);
  },
  { concept: 'node.runtime.process' },
);

test(
  'a specifier that is only dots is still relative',
  () => {
    expectEqual(classify('./'), 'relative');
    expectEqual(classify('../'), 'relative');
  },
  { concept: 'node.runtime.modules' },
);

test(
  'a scoped package is a bare specifier',
  () => {
    expectEqual(classify('@scope/package'), 'bare');
    expectEqual(resolveRelative('/app/index.js', '@scope/package'), null);
  },
  { concept: 'node.runtime.modules' },
);

test(
  'an absolute path is not a bare specifier',
  () => {
    // The classifier must reach its last line, rather than answering 'bare'
    // for everything it has not already matched.
    expectEqual(classify('/opt/lib/helpers.js'), 'absolute');
    expectEqual(classify('lodash'), 'bare');
  },
  { concept: 'node.runtime.modules' },
);

test(
  'a variable explicitly set to null is a value, not an absence',
  () => {
    // Strict comparison against undefined: a config object built in code
    // rather than read from the environment can hold a real null, and
    // loose equality would quietly treat it as unset.
    let message = '';
    try {
      readConfig({ PORT: null }, { PORT: 80 });
    } catch (error) {
      message = error.message;
    }
    expectTrue(message.includes('PORT'));
  },
  { concept: 'node.runtime.process' },
);
