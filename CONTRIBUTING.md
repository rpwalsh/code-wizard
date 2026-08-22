# Contributing

## Before you push

```bash
npm run verify
```

That runs lint, build and tests. If you touched exercise content, also run:

```bash
node packages/cli/dist/main.js exercise validate
```

## Where things go

| Change                     | Package                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| A new exercise             | `languages/<language>/exercises/` — see [docs/authoring.md](docs/authoring.md) |
| A new skill                | `languages/<language>/src/skills.ts`                                           |
| A new language             | A new `languages/<id>/` implementing `LanguageRuntime`                         |
| Anything language-specific | `languages/`, never `packages/`                                                |

The last row is the rule that keeps the platform viable. If you find yourself wanting to branch on
a language id inside `packages/`, the runtime contract is missing something — extend the contract
instead.

## Tests

Every package's tests live beside its source as `*.test.ts`. The Python integration tests skip
rather than fail when no interpreter or pytest is available, so a checkout without Python still
gives a clean run for everything else.

Security-relevant behaviour is tested by exercising it against real processes, not by asserting the
code exists. If you change the execution layer, the tests in
`packages/execution/src/process-runner.test.ts` are the ones to read first.

## Commits

Explain why, not what — the diff already says what. Where a change was driven by something that
went wrong, say what went wrong.
