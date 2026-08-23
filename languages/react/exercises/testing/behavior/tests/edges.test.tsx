// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The race, the failure, and the empty result. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { ResultList, search, searchMachine } from '../main.js';

test(
  'a late response must not resurrect an idle screen',
  () => {
    const { getState, actions } = searchMachine();
    actions.typed('re');
    actions.typed('');
    // The request from 're' lands now — after the user cleared the box.
    actions.resolved(['react']);

    expectEqual(getState().status, 'idle');
    expectEqual(getState().results, []);
  },
  { concept: 'react.testing.async' },
);

test(
  'a late failure is ignored the same way',
  () => {
    const { getState, actions } = searchMachine();
    actions.typed('re');
    actions.resolved(['react']);
    actions.failed();
    expectEqual(getState().status, 'done');
  },
  { concept: 'react.testing.async' },
);

test(
  'a rejecting fetcher becomes ok: false, never a throw',
  async () => {
    const outcome = await search(async () => {
      throw new Error('network');
    }, 'q');
    expectEqual(outcome, { ok: false });
  },
  { concept: 'react.testing.async' },
);

test(
  'failure clears the results and shows the error view',
  () => {
    const { getState, actions } = searchMachine();
    actions.typed('re');
    actions.failed();

    expectEqual(getState().results, []);
    expectEqual(
      renderToStaticMarkup(<ResultList state={getState()} />),
      '<p class="error">Search failed</p>',
    );
  },
  { concept: 'react.testing.behavior' },
);

test(
  'done with nothing found says so instead of an empty list',
  () => {
    const state = { query: 'zzz', status: 'done', results: [] } as const;
    expectEqual(renderToStaticMarkup(<ResultList state={state} />), '<p class="hint">No matches</p>');
  },
  { concept: 'react.testing.behavior' },
);

test(
  'searching renders dimmed stale results',
  () => {
    const state = { query: 'rea', status: 'searching', results: ['react'] } as const;
    const markup = renderToStaticMarkup(<ResultList state={state} />);
    expectTrue(markup.includes('results dim'));
    expectTrue(markup.includes('<li>react</li>'));
  },
  { concept: 'react.testing.behavior' },
);
