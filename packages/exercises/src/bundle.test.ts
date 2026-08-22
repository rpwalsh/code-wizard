import type { Skill } from '@forge/core';
import { describe, expect, it } from 'vitest';

import {
  BUNDLE_FORMAT,
  BUNDLE_VERSION,
  BundleError,
  bundleSizeBytes,
  catalogFromBundle,
  parseBundle,
  toBundle,
} from './bundle.ts';
import type { Exercise } from './model.ts';
import { attemptWorkspace, testVisibility } from './model.ts';

const skills: Skill[] = [
  { id: 'python.a', name: 'A', category: 'Test', prerequisites: [], language: 'python' },
];

function exercise(id: string): Exercise {
  return {
    id,
    version: 2,
    language: 'python',
    title: id,
    kind: 'micro-problem',
    difficulty: 2,
    estimatedSeconds: 180,
    skills: ['python.a'],
    prerequisites: [],
    learningObjectives: ['Do it'],
    prompt: 'Do it',
    starter: { files: [{ path: 'main.py', contents: 'stub' }], entryPoint: 'main.py' },
    solution: { files: [{ path: 'main.py', contents: 'real' }], entryPoint: 'main.py' },
    tests: [
      {
        path: 'tests/test_a.py',
        visibility: 'visible',
        contents: 'assert True',
        concept: 'python.a',
      },
      { path: 'tests/test_h.py', visibility: 'hidden', contents: 'assert True' },
    ],
    hints: [{ level: 'explicit', text: 'Here.' }],
    explanation: 'Because.',
    source: { directory: 'C:/Users/someone/private/exercises/demo' },
  };
}

describe('content bundling', () => {
  it('round-trips through JSON into a working catalogue', () => {
    const document = toBundle([exercise('python.demo.one')], skills);
    const restored = parseBundle(JSON.stringify(document));
    const catalog = catalogFromBundle(restored);

    expect(catalog.size).toBe(1);
    const loaded = catalog.get('python.demo.one');
    expect(loaded.title).toBe('python.demo.one');
    expect(loaded.version).toBe(2);
    expect(loaded.hints).toHaveLength(1);
    expect(loaded.explanation).toBe('Because.');
  });

  it('preserves everything the runtime needs to run the exercise', () => {
    const restored = parseBundle(JSON.stringify(toBundle([exercise('python.demo.one')], skills)));
    const loaded = catalogFromBundle(restored).get('python.demo.one');

    const workspace = attemptWorkspace(loaded);
    expect(workspace.files.map((file) => file.path).sort()).toEqual([
      'main.py',
      'tests/test_a.py',
      'tests/test_h.py',
    ]);
    expect(testVisibility(loaded)).toEqual({
      'tests/test_a.py': 'visible',
      'tests/test_h.py': 'hidden',
    });
  });

  it('does not publish the author absolute paths', () => {
    const document = toBundle([exercise('python.demo.one')], skills, {
      relativise: (directory) => directory.split('/').slice(-2).join('/'),
    });
    expect(document.exercises[0]?.source.directory).toBe('exercises/demo');
    expect(JSON.stringify(document)).not.toContain('C:/Users/someone');
  });

  it('sorts deterministically so a rebuild produces an identical file', () => {
    const generatedAt = '2026-03-01T00:00:00.000Z';
    const first = toBundle([exercise('python.b'), exercise('python.a')], skills, { generatedAt });
    const second = toBundle([exercise('python.a'), exercise('python.b')], skills, { generatedAt });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('reports its transfer size', () => {
    const document = toBundle([exercise('python.demo.one')], skills);
    expect(bundleSizeBytes(document)).toBeGreaterThan(100);
  });

  it('rejects a file that is not a bundle', () => {
    expect(() => parseBundle('{"format":"something-else","version":1}')).toThrow(BundleError);
  });

  it('rejects a bundle from a different version, telling you to rebuild', () => {
    expect(() =>
      parseBundle(JSON.stringify({ format: BUNDLE_FORMAT, version: BUNDLE_VERSION + 1 })),
    ).toThrow(/Rebuild the bundle/);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseBundle('{ not json')).toThrow(/not valid JSON/);
  });

  it('rejects a truncated bundle rather than yielding an empty catalogue', () => {
    expect(() =>
      parseBundle(JSON.stringify({ format: BUNDLE_FORMAT, version: BUNDLE_VERSION })),
    ).toThrow(/missing its exercises/);
  });

  it('rejects a bundle containing a malformed exercise', () => {
    expect(() =>
      parseBundle(
        JSON.stringify({
          format: BUNDLE_FORMAT,
          version: BUNDLE_VERSION,
          skills: [],
          exercises: [{ id: 'python.x' }],
        }),
      ),
    ).toThrow(/malformed exercise/);
  });
});
