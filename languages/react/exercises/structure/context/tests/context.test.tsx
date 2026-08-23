// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Providers, defaults and pass-through children. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { Badge, Panel, StatusPanel, ThemeContext } from '../main.js';

test(
  'a badge reads the provided theme',
  () => {
    const markup = renderToStaticMarkup(
      <ThemeContext.Provider value="dark">
        <Badge>new</Badge>
      </ThemeContext.Provider>,
    );
    expectEqual(markup, '<span class="badge dark">new</span>');
  },
  { concept: 'react.structure.context' },
);

test(
  'no provider means the default theme',
  () => {
    expectEqual(renderToStaticMarkup(<Badge>new</Badge>), '<span class="badge light">new</span>');
  },
  { concept: 'react.structure.context' },
);

test(
  'the provider reaches through components that never mention it',
  () => {
    const markup = renderToStaticMarkup(
      <ThemeContext.Provider value="dark">
        <Panel title="Inbox">
          <Badge>3</Badge>
        </Panel>
      </ThemeContext.Provider>,
    );
    // Panel threads nothing; the badge still sees dark.
    expectTrue(markup.includes('badge dark'));
  },
  { concept: 'react.structure.context' },
);

test(
  'a panel wraps whatever children it is given',
  () => {
    const markup = renderToStaticMarkup(
      <Panel title="Files">
        <em>empty</em>
      </Panel>,
    );
    expectTrue(markup.includes('<h3>Files</h3>'));
    expectTrue(markup.includes('<div class="body"><em>empty</em></div>'));
  },
  { concept: 'react.structure.composition' },
);

test(
  'a healthy status renders its children in a panel',
  () => {
    const markup = renderToStaticMarkup(
      <StatusPanel state={{ error: null, retries: 0 }}>
        <p>All good</p>
      </StatusPanel>,
    );
    expectTrue(markup.includes('<h3>Status</h3>'));
    expectTrue(markup.includes('<p>All good</p>'));
  },
  { concept: 'react.structure.composition' },
);
