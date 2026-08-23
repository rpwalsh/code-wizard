// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Refs keep identity; memo skips work. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { HookSlots } from '../main.js';

test(
  'a ref is the same box on every render',
  () => {
    const hooks = new HookSlots();

    hooks.beginRender();
    const first = hooks.useRef(0);
    hooks.endRender();

    first.current = 99;

    hooks.beginRender();
    const second = hooks.useRef(0);
    hooks.endRender();

    expectTrue(first === second);
    expectEqual(second.current, 99);
  },
  { concept: 'react.hooks.ref' },
);

test(
  'memo computes once for unchanged deps',
  () => {
    const hooks = new HookSlots();
    let computes = 0;
    const render = (dep: number) => {
      hooks.beginRender();
      const value = hooks.useMemo(() => {
        computes += 1;
        return dep * 10;
      }, [dep]);
      hooks.endRender();
      return value;
    };

    expectEqual(render(1), 10);
    expectEqual(render(1), 10);
    expectEqual(render(1), 10);
    expectEqual(computes, 1);
  },
  { concept: 'react.hooks.memo' },
);

test(
  'memo recomputes when a dep changes',
  () => {
    const hooks = new HookSlots();
    let computes = 0;
    const render = (dep: number) => {
      hooks.beginRender();
      const value = hooks.useMemo(() => {
        computes += 1;
        return dep * 10;
      }, [dep]);
      hooks.endRender();
      return value;
    };

    expectEqual(render(1), 10);
    expectEqual(render(2), 20);
    expectEqual(render(2), 20);
    expectEqual(computes, 2);
  },
  { concept: 'react.hooks.memo' },
);

test(
  'two refs occupy two independent slots',
  () => {
    const hooks = new HookSlots();

    hooks.beginRender();
    const left = hooks.useRef('L');
    const right = hooks.useRef('R');
    hooks.endRender();

    left.current = 'left!';

    hooks.beginRender();
    expectEqual(hooks.useRef('L').current, 'left!');
    expectEqual(hooks.useRef('R').current, 'R');
    hooks.endRender();
  },
  { concept: 'react.hooks.ref' },
);

test(
  'memo and ref coexist on the same slot array',
  () => {
    const hooks = new HookSlots();
    const render = (n: number) => {
      hooks.beginRender();
      const box = hooks.useRef(0);
      const doubled = hooks.useMemo(() => n * 2, [n]);
      hooks.endRender();
      return { box, doubled };
    };

    const first = render(3);
    first.box.current = 7;
    const second = render(4);

    expectTrue(first.box === second.box);
    expectEqual(second.box.current, 7);
    expectEqual(second.doubled, 8);
  },
  { concept: 'react.hooks.rules' },
);
