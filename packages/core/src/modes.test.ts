import { describe, expect, it } from 'vitest';

import type { ModeAffordances } from './modes.ts';
import {
  affordancesFor,
  describeMode,
  isClosedBook,
  nextRung,
  rungOf,
  trainingModes,
  withdrawalLadder,
} from './modes.ts';

/** Every affordance that is a yes/no offer of help. */
const OFFERS = [
  'starterCode',
  'hints',
  'documentation',
  'visibleTestSource',
  'editorAutocomplete',
  'solutionReveal',
] as const satisfies readonly (keyof ModeAffordances)[];

function offersOf(mode: (typeof trainingModes)[number]): Set<string> {
  const affordances = affordancesFor(mode);
  return new Set(OFFERS.filter((offer) => affordances[offer]));
}

describe('the withdrawal ladder', () => {
  it('only ever takes assistance away, never adds it back', () => {
    // This is the whole shape of the product. If a higher rung ever handed
    // something back, "further up" would stop meaning "less help" and the
    // dependency measurement underneath it would stop meaning anything.
    for (let rung = 1; rung < trainingModes.length; rung += 1) {
      const below = offersOf(trainingModes[rung - 1]!);
      const here = offersOf(trainingModes[rung]!);

      for (const offer of here) {
        expect(below.has(offer), `${trainingModes[rung]} offers ${offer} but the rung below does not`)
          .toBe(true);
      }
      expect(here.size).toBeLessThan(below.size);
    }
  });

  it('never weakens the evidence a higher rung produces', () => {
    for (let rung = 1; rung < trainingModes.length; rung += 1) {
      expect(affordancesFor(trainingModes[rung]!).evidenceWeight).toBeGreaterThanOrEqual(
        affordancesFor(trainingModes[rung - 1]!).evidenceWeight,
      );
    }
  });

  it('numbers the rungs in declaration order and ends', () => {
    expect(rungOf('learn')).toBe(0);
    expect(rungOf('blank-page')).toBeGreaterThan(rungOf('fluency'));
    expect(nextRung('fluency')).toBe('blank-page');
    expect(nextRung('simulation')).toBeNull();
  });

  it('describes every rung by what it withdraws', () => {
    expect(withdrawalLadder.map((entry) => entry.mode)).toEqual([...trainingModes]);
    for (const entry of withdrawalLadder) {
      expect(entry.name).not.toBe('');
      expect(entry.withdraws).not.toBe('');
    }
    expect(describeMode('blank-page').withdraws).toMatch(/starter/i);
  });
});

describe('blank page', () => {
  it('withdraws the starter code but keeps the tests readable', () => {
    // The tests are the specification, not a hint. Taking them away as well
    // is a different exercise, and it is the next rung up.
    const blank = affordancesFor('blank-page');
    expect(blank.starterCode).toBe(false);
    expect(blank.visibleTestSource).toBe(true);
    expect(isClosedBook('blank-page')).toBe(true);
  });

  it('is the first rung that hands over an empty file', () => {
    expect(affordancesFor('fluency').starterCode).toBe(true);
    for (const mode of trainingModes.slice(rungOf('blank-page'))) {
      expect(affordancesFor(mode).starterCode).toBe(false);
    }
  });
});
