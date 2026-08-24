<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

# Development

Node 22 or newer. Python 3.10+ with pytest for the desktop runtime and for the
content gates; the browser build needs neither.

```bash
npm install
npm run verify
```

`verify` is the whole gate: generated sources are in sync, every file
carries the copyright notice, spelling is American throughout (`npm run
spelling` fixes what `spelling:check` reports — identifiers, directory names
and prose alike), lint passes, everything type-checks including both apps, the
browser bundle builds, and 553 tests pass.

The bundle is built inside `verify` because two of the tests read it: one
scans the shipped JavaScript for external hosts, the other reads the content
security policy out of the built HTML. A test that checks an artifact needs
the artifact.

The browser suite is separate and slower — 45 tests in a real Chromium,
including a full Python run and a PHP one:

```bash
npx playwright test --config apps/web/playwright.config.ts
```

---

## The commands

```bash
npm run build        # tsc --build across the package graph
npm run typecheck    # the packages, then apps/web and apps/desktop
npm run lint         # eslint, including the bans below
npm run test         # vitest
npm run web          # build packages, bundle the curriculum, build the site
npm run e2e          # the browser suite, against the production bundle
npm run screenshots  # regenerate docs/images from the production bundle
npm run generate     # re-inline the Python support files after editing them
```

The two apps are not part of the `tsc --build` solution, which is why
`typecheck` exists separately and why `verify` runs it. Without that, a type
error in the UI reaches the bundler instead of the type checker.

---

## The toolkit

```bash
node packages/cli/dist/main.js runtime doctor
node packages/cli/dist/main.js exercise list
node packages/cli/dist/main.js exercise run python.collections.dict-lookup
node packages/cli/dist/main.js exercise validate
node packages/cli/dist/main.js exercise mutate
node packages/cli/dist/main.js curriculum check
node packages/cli/dist/main.js curriculum syllabus
node packages/cli/dist/main.js curriculum planned
node packages/cli/dist/main.js plan next
node packages/cli/dist/main.js content bundle
```

`runtime doctor` does not report versions. It executes code in a sandbox,
trips a timeout, and overflows an output buffer, so a pass means the isolation
works on this machine rather than that the right software is installed.

`curriculum syllabus` reports, per language, the gap between the planned
course and the exercises that exist. A lesson counts only when _every_ skill it
names has content behind it.

`curriculum planned` lists the curricula in `curricula/` — designed, and with
no runtime behind any of them. It is a separate report on purpose: mixing a
course that cannot be practiced into the same table as one with 228 lessons
behind it would make the difference a percentage rather than a fact.

---

## The gates

Five things stand between a change and the main branch, and each exists
because of a specific way this kind of project rots.

**`exercise validate`** executes every shipped exercise: the reference
solution must pass and the starter must fail. A broken exercise is worse than
a missing one.

**`exercise mutate`** breaks the reference solution on purpose — a flipped
comparison, an off-by-one, a return value discarded — and requires the tests
to notice. A suite that passes a wrong solution tells the learner they were
right, and every mastery number derived from that attempt inherits the lie.
All fourteen languages have operators, chosen per language rather than
translated between them. Faults that genuinely cannot be detected are recorded
in the manifest with a required reason; see [authoring.md](authoring.md).

The number to read is the count of *unexplained* survivors, not the
percentage: an excused mutant is neither caught nor a hole, so a suite with
every survivor accounted for can sit below 100% and still be finished.

**`tests/cross-runtime.test.ts`** puts the whole Python curriculum through
the native interpreter and the WebAssembly one and requires identical
verdicts. A learner on the website and one on the desktop have to be measured
by the same ruler.

**`tests/principles.test.ts`** enforces the claims in
[PRINCIPLES.md](../PRINCIPLES.md) that can be checked mechanically: no LLM
client anywhere in the dependency tree, no model endpoints in shipped source,
no payment or analytics dependency in the web build, no account identifiers,
no language name inside the engines, and both licenses present and referenced.

**The egress guards** are the fifth, and they are three tests rather than one:
no external host named in the browser source, absolute or protocol-relative;
no new external host in the built bundle beyond a recorded list; and a
content security policy in the shipped HTML naming no host at all. The browser
suite adds two more — that the policy is enforced rather than merely present,
and that no screen in the app makes a request off its own origin. See
[data.md](data.md).

---

## Rules the code holds itself to

**No `any`, and no `unknown`.** Both are lint errors. Trust boundaries — JSON,
IPC, SQL rows, worker messages — use precise unions, typed channel maps and
validation on the way in, so a malformed input names the field it failed on
instead of producing something that looks fine and behaves strangely.

**The engines do not know Python exists.** A test fails if a language name
appears in `packages/core`, `packages/learning`, `packages/curriculum` or
`packages/exercises` outside a comment. Everything language-specific lives
behind the `LanguageRuntime` contract in `languages/`.

**Evidence is append-only; the model over it is derived.** Attempts are an
event log. Mastery, trajectories, baselines and assistance dependency are all
projections recomputed from that log, so improving the scoring model
re-derives history rather than invalidating it.

---

## Layout

```text
packages/
  core/         The contracts. Runtime, workspace, mastery, modes, prediction.
  execution/    Sandboxed process execution: timeouts, output caps, process trees.
  exercises/    Exercises as data — schema, loader, catalog, validator, mutation, bundling.
  learning/     Attempts, fluency metrics, grading, the mastery model.
  curriculum/   Spaced repetition, the recommender, sessions, demonstrations, the syllabus.
  storage/      One ProgressStore contract; SQLite, IndexedDB and in-memory behind it.
  session/      Where the engines meet: one learner, one exercise, one sitting.
  runtime-web/  CPython in WebAssembly, in a worker.
  cli/          The authoring and diagnostic toolkit.

languages/       Languages that run.
  python/
    src/        The native runtime adapter, the skill graph, mutation operators.
    runtime/    The `retrainer` package: pytest plugin, assertions, tracer, diagnostics.
    exercises/  The content.
    curriculum/ The course, one file per stage.
  javascript/
    src/        The Node runtime adapter, the skill graph, mutation operators.
    runtime/    The `retrainer` package: the test registry, assertions, the harness.
    exercises/  The content.
    curriculum/ The course, one file per stage.

curricula/       Courses that are designed and cannot be practiced yet. Data only.

apps/
  web/          The interface. Static build, runs anywhere.
  desktop/      Electron shell around the same interface, using a real interpreter.
```

---

## Tests that run real processes

The suite includes security tests that spawn actual processes: runaway loops,
processes that ignore interrupts, output floods, process trees, path traversal
and environment leakage. They are slow and they are the point — isolation that
has only been reasoned about is not isolation.

The content gate derives its timeout from the size of the catalog, because
it executes every exercise twice and a flat limit turns a real failure into
something that looks like a timeout as the curriculum grows.
