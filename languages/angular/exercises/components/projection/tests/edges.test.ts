// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** First match wins, words are not substrings, and markup is escaped. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectFalse } from 'retrainer/expect.js';

import { distribute, matchesSelector, renderSlot, type ContentNode } from '../main.ts';

const node = (tag: string, attributes: Record<string, string> = {}, text = ''): ContentNode => ({
  tag,
  attributes,
  text,
});

test(
  'a node matching two slots lands only in the first',
  () => {
    const both = node('h2', { 'card-title': '' });
    const placed = distribute([both], ['[card-title]', 'h2']);
    expectEqual(placed.get('[card-title]'), [both]);
    expectEqual(placed.get('h2'), []);
  },
  { concept: 'angular.components.content' },
);

test(
  'a class selector matches words, not substrings',
  () => {
    expectFalse(matchesSelector(node('div', { class: 'navigation' }), '.nav'));
    expectFalse(matchesSelector(node('div', {}), '.nav'));
  },
  { concept: 'angular.components.content' },
);

test(
  'attribute values are escaped',
  () => {
    expectEqual(
      renderSlot([node('a', { title: 'Say "hi" & <go>' }, 'link')]),
      '<a title="Say &quot;hi&quot; &amp; &lt;go>">link</a>',
    );
  },
  { concept: 'angular.components.binding' },
);

test(
  'text is escaped for markup, not for quotes',
  () => {
    expectEqual(renderSlot([node('p', {}, 'a < b & c "d"')]), '<p>a &lt; b &amp; c "d"</p>');
  },
  { concept: 'angular.components.binding' },
);

test(
  'an empty slot renders as nothing',
  () => {
    expectEqual(renderSlot([]), '');
  },
  { concept: 'angular.components.binding' },
);
