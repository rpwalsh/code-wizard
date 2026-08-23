// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The rendered markup, state by state. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { ArticleCard, ArticleList, Tag, type Article } from '../main.js';

const article: Article = {
  id: 'a1',
  title: 'On keys',
  summary: 'Identity across renders.',
  tags: ['react', 'lists'],
};

test(
  'a tag is a labeled span',
  () => {
    expectEqual(renderToStaticMarkup(<Tag label="react" />), '<span class="tag">react</span>');
  },
  { concept: 'react.render.components' },
);

test(
  'a card holds title, summary and tags',
  () => {
    const markup = renderToStaticMarkup(<ArticleCard article={article} />);
    expectTrue(markup.includes('<h2>On keys</h2>'));
    expectTrue(markup.includes('<p>Identity across renders.</p>'));
    expectTrue(markup.includes('<span class="tag">react</span>'));
    expectTrue(markup.includes('<span class="tag">lists</span>'));
  },
  { concept: 'react.render.components' },
);

test(
  'no tags means no list at all',
  () => {
    const markup = renderToStaticMarkup(
      <ArticleCard article={{ ...article, tags: [] }} />,
    );
    expectTrue(!markup.includes('<ul'));
  },
  { concept: 'react.render.conditional' },
);

test(
  'loading wins over content',
  () => {
    const markup = renderToStaticMarkup(<ArticleList articles={[article]} loading={true} />);
    expectEqual(markup, '<p class="status">Loading…</p>');
  },
  { concept: 'react.render.conditional' },
);

test(
  'the empty state has its own message',
  () => {
    const markup = renderToStaticMarkup(<ArticleList articles={[]} loading={false} />);
    expectEqual(markup, '<p class="status">No articles yet</p>');
  },
  { concept: 'react.render.conditional' },
);

test(
  'articles render inside a section',
  () => {
    const second: Article = { ...article, id: 'a2', title: 'Second' };
    const markup = renderToStaticMarkup(
      <ArticleList articles={[article, second]} loading={false} />,
    );
    expectTrue(markup.startsWith('<section>'));
    expectTrue(markup.includes('<h2>On keys</h2>'));
    expectTrue(markup.includes('<h2>Second</h2>'));
  },
  { concept: 'react.render.lists' },
);
