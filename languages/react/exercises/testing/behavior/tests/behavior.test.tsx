// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** States in, markup out. Nothing else is the machine's business. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { ResultList, search, searchMachine } from '../main.js';

test(
  'typing starts a search and keeps the old results visible',
  () => {
    const { getState, actions } = searchMachine();
    actions.typed('re');
    actions.resolved(['react', 'redux']);
    actions.typed('rea');

    expectEqual(getState().status, 'searching');
    expectEqual(getState().results, ['react', 'redux']);
  },
  { concept: 'react.testing.behavior' },
);

test(
  'a resolution completes the search',
  () => {
    const { getState, actions } = searchMachine();
    actions.typed('re');
    actions.resolved(['react']);

    expectEqual(getState().status, 'done');
    expectEqual(getState().results, ['react']);
  },
  { concept: 'react.testing.behavior' },
);

test(
  'clearing the box returns to idle',
  () => {
    const { getState, actions } = searchMachine();
    actions.typed('re');
    actions.typed('');
    expectEqual(getState(), { query: '', status: 'idle', results: [] });
  },
  { concept: 'react.testing.behavior' },
);

test(
  'search resolves through a fetcher the test controls',
  async () => {
    const outcome = await search(async (query) => [`${query}-1`, `${query}-2`], 'go');
    expectEqual(outcome, { ok: true, results: ['go-1', 'go-2'] });
  },
  { concept: 'react.testing.async' },
);

test(
  'the states render their markup',
  () => {
    const idle = { query: '', status: 'idle', results: [] } as const;
    const done = { query: 'r', status: 'done', results: ['react'] } as const;

    expectEqual(renderToStaticMarkup(<ResultList state={idle} />), '<p class="hint">Type to search</p>');
    const markup = renderToStaticMarkup(<ResultList state={done} />);
    expectTrue(markup.includes('<li>react</li>'));
  },
  { concept: 'react.testing.behavior' },
);
