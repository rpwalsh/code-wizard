# Forge

**A code fluency training platform.** Not an AI coding assistant, and not primarily an assessment
platform — a place to practise writing code yourself, in a real environment, against real tests.

The first supported language is Python. The architecture is language-agnostic from the start.

---

## The problem

Most programming education asks _"do you understand this concept?"_. Most assessments ask
_"can you solve this problem?"_. AI tools ask _"can the system produce working code for you?"_.

Forge asks a different question:

> **Can you independently produce working code in this language?**

An engineer can understand dictionaries, loops, classes and algorithms perfectly, and still be
unable to write idiomatic Python quickly without help. That gap is a measurable skill of its own,
and it is what this trains.

There is no LLM in the learner experience. No generative hints, no AI autocomplete, no
conversational assistant, no external AI dependency.

---

## Status

Working today, all driven from the CLI:

| Area                                                                                | State       |
| ----------------------------------------------------------------------------------- | ----------- |
| Language runtime contract and registry                                              | Done        |
| Python runtime: execute, test, format, lint, diagnose, doctor                       | Done        |
| Execution sandbox: timeouts, output caps, process-tree kill, env allowlist          | Done        |
| Exercise format, loader, catalogue, content validator                               | Done        |
| Learning engine: attempts, fluency metrics, eight-dimension mastery                 | Done        |
| Curriculum engine: spaced repetition, explainable recommendations, session planning | Done        |
| Local persistence, export/import                                                    | Done        |
| Desktop IDE (Electron, Monaco, terminal, test panel)                                | Not started |
| Second language runtime                                                             | Not started |

7 exercises, 45 Python skills, 233 tests.

---

## Try it

Requires Node 22+, and Python 3.10+ with pytest for the Python runtime.

```bash
npm install
npm run build

node packages/cli/dist/main.js runtime doctor
```

The doctor does not just report versions — it executes code in a sandbox, trips a timeout, and
overflows an output buffer, so a pass means the isolation actually works on your machine.

```text
Forge Runtime Diagnostics — Python
──────────────────────────────────
✓ Python interpreter   C:\Python314\python.exe (py -3)
✓ Python version       3.14.0
✓ pytest               9.1.1
✓ Workspace execution
✓ Timeout enforcement
✓ Output limiting

Environment ready.
```

Then:

```bash
# What is in the catalogue
node packages/cli/dist/main.js exercise list

# Read one, hints and all
node packages/cli/dist/main.js exercise show python.collections.dict-lookup

# Run its tests against the starter code, then against the reference solution
node packages/cli/dist/main.js exercise run python.collections.dict-lookup
node packages/cli/dist/main.js exercise run python.collections.dict-lookup --solution

# Validate every exercise: solution must pass, starter must fail
node packages/cli/dist/main.js exercise validate

# Skill graph health and curriculum coverage
node packages/cli/dist/main.js curriculum check

# What to practise next, and the arithmetic behind it
node packages/cli/dist/main.js plan next --level rusty
node packages/cli/dist/main.js plan session
```

---

## What test failures look like

Test output is a teaching surface, not a log:

```text
✗ removes two adjacent expired sessions
    Expected:  ['a', 'b']
    Received:  ['a']
    Relevant concept: python.control.for
```

Hidden tests report only that they failed. Their assertions, expected values and locations never
leave the runtime boundary.

---

## Architecture

The single most important boundary in the system:

```text
LANGUAGE → Language Runtime → Coding Workspace → Exercise Engine → Learning Engine → Skill Graph
```

The learning engine does not know whether the learner wrote Python or Rust. The workspace does not
know how mastery is calculated. The Python runtime does not know which exercise invoked it.

```text
packages/
  core/         Language-neutral contracts. Nothing here knows Python exists.
  execution/    The security boundary: sandboxes, limits, process control.
  exercises/    Exercises as data — schema, loader, catalogue, validator.
  learning/     Attempts, fluency metrics, the mastery model.
  curriculum/   Spaced repetition, recommendations, session planning.
  storage/      Local SQLite persistence and export/import.
  cli/          Developer and authoring tooling.

languages/
  python/       The first runtime adapter, its skill graph, and its exercises.
```

See [docs/architecture.md](docs/architecture.md) for the reasoning, and
[docs/authoring.md](docs/authoring.md) for how to write an exercise.

---

## Development

```bash
npm run verify      # lint, build, test
npm test            # 233 tests
npm run lint
npm run format
```

The test suite includes security tests that run real processes: runaway loops, SIGINT-proof
processes, output floods, process trees, path traversal, and environment leakage. It also includes
a content gate that executes every shipped exercise — the reference solution must pass and the
starter must fail — because a broken exercise is worse than no exercise.
