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
      'apps/web/e2e/.results/**',
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
      // `toError()` in @forge/core is the one place that is allowed.
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
