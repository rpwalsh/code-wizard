// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'languages/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      /*
       * Exercise content is not this repository's test suite.
       *
       * A file at `languages/typescript/exercises/**\/tests/*.test.ts` is a test
       * a *learner* will run, inside a sandbox, against a harness that is only
       * present there. Collecting it here means importing `retrainer/test.js`
       * from a directory where it does not exist, so the whole file fails to
       * load — which is exactly what happened the first time an exercise was
       * written in a language whose extension vitest recognizes.
       *
       * These are validated instead by `code-retrainer exercise validate`,
       * which runs them the way a learner will: in a sandbox, with the harness
       * installed, against both the reference solution and the starter.
       */
      // Scoped to `languages/`, not `**/exercises/**`: the latter also
      // excludes `packages/exercises`, which is the loader's own test suite
      // and very much ours.
      'languages/*/exercises/**',
      // Likewise the harness sources themselves.
      'languages/*/runtime/**',
    ],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks',
  },
});
