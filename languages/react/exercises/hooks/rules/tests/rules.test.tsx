// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Slots, order, and the error the rules exist to prevent. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { HookSlots } from '../main.js';

test(
  'slots hand back their stored values in order',
  () => {
    const hooks = new HookSlots();

    hooks.beginRender();
    expectEqual(hooks.useSlot('a'), 'a');
    expectEqual(hooks.useSlot('b'), 'b');
    hooks.endRender();

    // Second render: initials are ignored; the slots already exist.
    hooks.beginRender();
    expectEqual(hooks.useSlot('ignored'), 'a');
    expectEqual(hooks.useSlot('ignored'), 'b');
    hooks.endRender();
  },
  { concept: 'react.hooks.rules' },
);

test(
  'setSlot is how an update reaches the next render',
  () => {
    const hooks = new HookSlots();

    hooks.beginRender();
    hooks.useSlot(0);
    hooks.endRender();

    hooks.setSlot(0, 41);

    hooks.beginRender();
    expectEqual(hooks.useSlot(0), 41);
    hooks.endRender();
  },
  { concept: 'react.hooks.rules' },
);

test(
  'a skipped hook is detected at the end of the render',
  () => {
    const hooks = new HookSlots();

    hooks.beginRender();
    hooks.useSlot('state');
    hooks.useSlot('effect');
    hooks.endRender();

    // The hook inside the if did not run this render.
    hooks.beginRender();
    hooks.useSlot('state');

    let caught: Error | null = null;
    try {
      hooks.endRender();
    } catch (error) {
      caught = error as Error;
    }
    expectTrue(caught !== null && caught.message.includes('hook order'));
  },
  { concept: 'react.hooks.rules' },
);

test(
  'an extra hook is detected too',
  () => {
    const hooks = new HookSlots();
    hooks.beginRender();
    hooks.useSlot(1);
    hooks.endRender();

    hooks.beginRender();
    hooks.useSlot(1);
    hooks.useSlot(2);
    let threw = false;
    try {
      hooks.endRender();
    } catch {
      threw = true;
    }
    expectTrue(threw);
  },
  { concept: 'react.hooks.rules' },
);
