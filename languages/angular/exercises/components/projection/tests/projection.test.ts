// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The sorting machine at work. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue, expectFalse } from 'retrainer/expect.js';

import { distribute, matchesSelector, renderSlot, type ContentNode } from '../main.ts';

const node = (tag: string, attributes: Record<string, string> = {}, text = ''): ContentNode => ({
  tag,
  attributes,
  text,
});

test(
  'the three selector shapes match their shapes',
  () => {
    expectTrue(matchesSelector(node('h2'), 'h2'));
    expectFalse(matchesSelector(node('h3'), 'h2'));
    expectTrue(matchesSelector(node('div', { 'card-title': '' }), '[card-title]'));
    expectFalse(matchesSelector(node('div'), '[card-title]'));
    expectTrue(matchesSelector(node('span', { class: 'hint small' }), '.hint'));
  },
  { concept: 'angular.components.content' },
);

test(
  'nodes land in their slots in order',
  () => {
    const title = node('h2', { 'card-title': '' }, 'Title');
    const body1 = node('p', {}, 'first');
    const body2 = node('p', {}, 'second');

    const placed = distribute([body1, title, body2], ['[card-title]']);
    expectEqual(placed.get('[card-title]'), [title]);
    expectEqual(placed.get('default'), [body1, body2]);
  },
  { concept: 'angular.components.content' },
);

test(
  'a slot that catches nothing is present and empty',
  () => {
    const placed = distribute([node('p')], ['[banner]']);
    expectEqual(placed.get('[banner]'), []);
  },
  { concept: 'angular.components.content' },
);

test(
  'nodes render with attributes and text',
  () => {
    expectEqual(
      renderSlot([node('p', { class: 'lead' }, 'Hello')]),
      '<p class="lead">Hello</p>',
    );
  },
  { concept: 'angular.components.binding' },
);
