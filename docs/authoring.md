<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

# Authoring an exercise

> **This documents the format, not an invitation.** The curriculum is not open
> content and contributions are not accepted — see
> [CONTENT-LICENSE.md](../CONTENT-LICENSE.md) and
> [CONTRIBUTING.md](../CONTRIBUTING.md). This file exists so that anyone can
> read exactly how an exercise is defined, graded and gated, which is the whole
> reason the content is data rather than code.

An exercise is a directory. Nothing about adding one requires changing application code.

```text
languages/python/exercises/collections/dict-lookup/
├── exercise.yaml          metadata, prompt, hints, explanation
├── starter/main.py        what the learner opens
├── solution/main.py       the reference implementation
└── tests/
    ├── test_lookup.py     visible
    ├── test_edges.py      edge
    └── test_hidden.py     hidden
```

Files under `starter/` and `solution/` are materialized at the workspace root, so `starter/main.py`
becomes `main.py`. Test paths in the manifest are workspace-relative and match their location on
disk.

---

## The manifest

```yaml
id: python.collections.dict-lookup # namespaced under its language
version: 1 # bump when tests change materially
language: python
title: Safe account lookup
kind: micro-problem
difficulty: 2 # 1 trivial recall … 5 multi-concept system
estimatedSeconds: 180
timeoutMs: 15000

skills: # what this trains
  - python.collections.dict-lookup
prerequisites: # what the learner needs first
  - python.collections.dict

learningObjectives:
  - Read a value out of a dictionary without assuming the key exists.

prompt: |
  Markdown shown in the prompt panel.

entryPoint: main.py

tests:
  - path: tests/test_lookup.py
    visibility: visible
    concept: python.collections.dict-lookup

hints:
  - level: conceptual
    text: …
  - level: explicit
    text: …

explanation: |
  Shown after completion. Explain *why*, not just *what*.
```

`kind` is one of `syntax-drill`, `completion`, `translation`, `bug-fix`, `micro-problem`,
`focused-problem`, `stateful-problem`, `progressive-stage`, `project`.

The manifest is strict: an unknown key is an error, not something ignored. A typo in a field name
would otherwise silently disable a feature.

---

## Test visibility

| Visibility    | Meaning                                                         |
| ------------- | --------------------------------------------------------------- |
| `visible`     | Shown in full, source included. What the learner works against. |
| `edge`        | Visible, tagged as probing a known failure mode.                |
| `hidden`      | Name and outcome only. Prevents passing by hardcoding.          |
| `performance` | Asserts complexity or latency rather than correctness.          |
| `regression`  | Re-runs an earlier stage's contract in a progressive exercise.  |

Hidden-test details are stripped at the runtime boundary. Nothing you write in a hidden test will
reach the learner.

---

## Writing tests

Use `retrainer.expect` rather than bare `assert` where the learner benefits from seeing both sides:

```python
import pytest

from retrainer.expect import expect_equal, expect_raises
from main import get_balance


@pytest.mark.concept("python.collections.dict-lookup")
def test_returns_zero_for_an_unknown_account():
    expect_equal(get_balance({"a": 1}, "missing"), 0)
```

`expect_equal`, `expect_true`, `expect_false`, `expect_close` and `expect_raises` all carry the
expected and received values as structured fields, which is what produces:

```text
Expected:  0
Received:  KeyError: 'missing'
Relevant concept: python.collections.dict-lookup
```

The `@pytest.mark.concept(...)` marker names the skill the test probes. It is what turns a failure
into a pointer at something to practice.

Pass a `message=` only when you have something to add beyond the expected/received pair — an
unnecessary message just repeats the panel.

### The same idea in every other language

Each runtime ships a harness with the same contract — named tests, a skill per test, structured
expected/received — in whatever shape is idiomatic there:

| Languages                                        | Harness                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| JavaScript, TypeScript, React, Angular, Node     | `import { test } from 'retrainer/test.js'` and `expectEqual` from `retrainer/expect.js`; the skill is the third argument: `{ concept: '...' }` |
| Go                                               | Plain `go test` beside `main.go` (a `tests/` directory would be a different package); the skill comes from the manifest's per-file `concept` |
| Rust                                             | Plain `#[test]` under `tests/`, opening with `#[path = "../main.rs"] mod exercise;` — the runner compiles every test file into one binary |
| C, C++                                           | `RETRAINER_TEST(name, "skill") { ... }` with `RETRAINER_ASSERT_INT/STR/NEAR`; exercises split declarations into `main.h`/`main.hpp` so several test files can share them |
| C#, ASP.NET                                      | `[RetrainerTest("name", Concept = "skill")]` methods asserting through `Retrainer.Assert`                                |
| PHP                                              | `retrainer_test('name', fn () => ..., 'skill')` with `assert_equal`, `assert_throws` and friends                         |
| SQL                                              | Comment-directed: `-- test:`, `-- concept:`, `-- expect:` above each statement; `-- uses: main.sql` runs the learner's query |

The starter must fail honestly: `throw new Error('not implemented')`,
`unimplemented!()`, `throw new NotImplementedException()`, or a function that
returns the wrong shape — never a stub that happens to pass a test.

Two languages want the zero value rather than a throw. In Go a panic aborts
the whole test binary, so the learner sees one failure and nothing after it;
return `nil` and a zero-valued struct instead. In C and C++ a starter that
returns `NULL` where the tests dereference crashes the process before it can
write a report, so return an empty-but-valid structure where the shape allows
it. Either way, run the starter and read what a learner would see.

---

## Rules the validator enforces

Run `code-wizard exercise validate <id>` before committing. It executes the content:

- **The reference solution must pass every test.**
- **The starter must fail at least one.** An exercise whose starter is already green asks the
  learner to do nothing.
- Every declared test file must produce at least one test case.
- Every starter file must have a counterpart in the solution.
- At least one test must be visible.
- Skills and prerequisites must exist in the skill graph.
- An exercise may not require the skill it teaches.

Warnings, which do not block:

- Difficulty 3+ with no hidden or edge tests — passable by hardcoding.
- A hint ladder that does not end at `explicit` — a stuck learner has no exit.
- A syntax drill estimated at over two minutes.

`--fast` skips execution. Useful while iterating; never in CI, because execution is the only check
that proves the exercise works.

---

## Writing a good exercise

**Make the starter fail for the right reason.** In the bug-fix exercise `python.control.loop-bug`,
the starter passes most tests and fails only on adjacent expired sessions. That single failure _is_
the lesson. A starter that fails everything teaches nothing about which idea is missing.

**Write the hint ladder as a descent, not five restatements.** Conceptual names the question,
structural describes the shape of the answer, language points at the feature, syntax gives the
form, explicit gives the line. Each level should be usable on its own.

**Put an edge test on the mistake people actually make.** `accounts.get(id) or default` looks right
and is wrong because `0` is falsy. That deserves its own named test, not a footnote.

**Explain the why.** The explanation is read after success, when the learner has the context to
absorb a design point they were not ready for beforehand.

---

## Progressive systems

A progressive stage sets `continues:` to the previous stage's id, and its `starter/` is the previous
stage's _solution_. Copy stage 1's tests in as `visibility: regression` so the earlier contract keeps
running — the cheapest way to discover you broke it is to still be testing it.

`python.modeling.ledger-1` and `ledger-2` are the worked example. On stage 2's starter, the 11
regression tests pass and the 23 new ones fail, which is exactly the shape a stage should have.

---

## Checking the tests would catch a wrong answer

`code-wizard exercise validate` proves the reference solution passes and the starter fails.
Neither proves the tests are any good: a suite that accepts a _wrong_ solution is worse than no
suite at all, because it tells the learner they got it right, and every mastery number derived from
that attempt inherits the lie.

```bash
code-wizard exercise mutate            # the whole curriculum
code-wizard exercise mutate <id>       # one exercise
```

This introduces small, plausible faults into the reference solution one at a time — a flipped
comparison, an off-by-one, an `and` that should be an `or`, a return value replaced by `None` — and
requires the tests to fail for each. Only the solution is mutated; the tests stay exactly as the
learner meets them.

A surviving mutant is a hole:

```text
  ✗ main.py:18 — `or` became `and` (boolean)
  Each line above is a change the tests accepted. Add a case that would fail.
```

Nothing inside a string or a comment is ever mutated, so a docstring cannot produce a mutant no
test could kill.

Every language has operators. They are not one set with different symbols: the
faults are chosen per language, because "the mistakes people make" is a fact about a language.
PHP leads with `===` becoming `==`, Go with `err != nil` becoming `err == nil`, Rust with
`is_some` becoming `is_none`, SQL with `AND` becoming `OR` and `LEFT JOIN` becoming `INNER JOIN`.
TypeScript, React, Angular and Node share JavaScript's set, and ASP.NET shares C#'s — those are
the same language wearing a framework.

An operator whose mutants are *always* equivalent is worse than no operator: it reports holes that
do not exist. `&&` for `and` in PHP was removed for exactly that reason — they differ only in
precedence against assignment, so inside a condition the swap changes nothing.

Two things are never mutated. Test files, because the question is whether the tests notice a broken
solution. And any solution file the starter already contains byte for byte — SQL's `schema.sql`,
C's declaration header — because that is scaffolding the learner was handed, and mutating it
measures the fixture rather than the reasoning.

### Equivalent mutants

Some faults genuinely cannot be caught, because they do not change behavior. `parts[-1]` and
`parts[+1]` are the same element whenever there are exactly two parts. Record those in the manifest
rather than contriving a test to satisfy the tool:

```yaml
mutationExceptions:
  - path: main.py
    operator: arithmetic
    why: >-
      Flipping the sign in parts[-1] gives parts[+1], and for any address with a
      single @ those index the same element. The mutant is equivalent, not
      uncaught.
```

`why` is required and must be a sentence. A suppression nobody had to justify is a suppression
nobody will revisit, and the gate rots quietly behind it.
