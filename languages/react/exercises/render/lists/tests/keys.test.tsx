// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** React reports a missing key on the console; silence is the assertion. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { ArticleCard, ArticleList, type Article } from '../main.js';

const articles: Article[] = [
  { id: 'a1', title: 'One', summary: 's', tags: ['x', 'y'] },
  { id: 'a2', title: 'Two', summary: 's', tags: ['z'] },
];

test(
  'rendering the list produces no key warnings',
  () => {
    const complaints: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      complaints.push(args.map(String).join(' '));
    };
    try {
      renderToStaticMarkup(<ArticleList articles={articles} loading={false} />);
      renderToStaticMarkup(<ArticleCard article={articles[0]} />);
    } finally {
      console.error = original;
    }
    expectEqual(complaints, []);
  },
  { concept: 'react.render.lists' },
);
