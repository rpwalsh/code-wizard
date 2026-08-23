// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The fallback policy as data, and as markup. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { StatusPanel, errorView } from '../main.js';

test(
  'no error means content',
  () => {
    expectEqual(errorView({ error: null, retries: 99 }), { kind: 'content' });
  },
  { concept: 'react.structure.errors' },
);

test(
  'an error offers retry until the third attempt',
  () => {
    expectEqual(errorView({ error: 'boom', retries: 0 }), {
      kind: 'fallback',
      message: 'boom',
      canRetry: true,
    });
    expectEqual(errorView({ error: 'boom', retries: 2 }).canRetry, true);
    expectEqual(errorView({ error: 'boom', retries: 3 }).canRetry, false);
  },
  { concept: 'react.structure.errors' },
);

test(
  'the fallback shows the message and the button',
  () => {
    const markup = renderToStaticMarkup(
      <StatusPanel state={{ error: 'Network unreachable', retries: 1 }}>
        <p>hidden</p>
      </StatusPanel>,
    );
    expectTrue(markup.includes('Network unreachable'));
    expectTrue(markup.includes('<button>Retry</button>'));
    expectTrue(!markup.includes('hidden'));
  },
  { concept: 'react.structure.errors' },
);

test(
  'past the retry limit the button is gone',
  () => {
    const markup = renderToStaticMarkup(
      <StatusPanel state={{ error: 'Still down', retries: 3 }}>
        <p>hidden</p>
      </StatusPanel>,
    );
    expectTrue(markup.includes('Still down'));
    expectTrue(!markup.includes('<button'));
  },
  { concept: 'react.structure.errors' },
);
