# Authoring an exercise

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

Files under `starter/` and `solution/` are materialised at the workspace root, so `starter/main.py`
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

Use `forge_expect` rather than bare `assert` where the learner benefits from seeing both sides:

```python
import pytest

from forge_expect import expect_equal, expect_raises
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
into a pointer at something to practise.

Pass a `message=` only when you have something to add beyond the expected/received pair — an
unnecessary message just repeats the panel.

---

## Rules the validator enforces

Run `forge exercise validate <id>` before committing. It executes the content:

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
