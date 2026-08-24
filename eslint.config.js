// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      // Build output copied into the desktop app, not source.
      'apps/desktop/renderer/**',
      'apps/desktop/content/**',
      'apps/web/public/content/**',
      // Vendored WebAssembly runtimes: Pyodide's loader and esbuild's, copied
      // in by `scripts/vendor-runtimes.mjs` so the site works offline. They are
      // somebody else's build output, they are minified, and linting them
      // produced fourteen hundred complaints about code nobody here wrote.
      'apps/web/public/runtime/**',
      'apps/web/e2e/.results/**',
      // Exercise content is teaching material, not platform source. A starter
      // has unused parameters by design, and a test about equality asserts
      // things a linter is built to object to. It is graded by
      // `exercise validate` and `exercise mutate` instead, which check what
      // actually matters about it.
      'languages/*/exercises/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Build scripts are plain Node ESM, outside the TypeScript project.
    files: ['scripts/**/*.mjs', 'apps/*/scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
  {
    // A language's own runtime support is written in that language and is
    // shipped to the learner's machine, not compiled with the platform. It is
    // linted for obvious mistakes and nothing more.
    files: ['languages/*/runtime/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        performance: 'readonly',
        globalThis: 'readonly',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // `unknown` disables nothing, but it does defer typing, and deferred
      // typing has a habit of never happening. Trust boundaries use the
      // `JsonValue` union or a typed channel map instead, so the shape is
      // narrowable from the moment it arrives.
      //
      // The single exception is a `catch` binding, which the language types as
      // `unknown` and where the only alternative TypeScript offers is `any`.
      // `toError()` in @code-wizard/core is the one place that is allowed.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSUnknownKeyword',
          message:
            'Avoid `unknown`. Use a precise type: JsonValue for parsed data, a typed channel map for IPC, or a discriminated union.',
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },
);
