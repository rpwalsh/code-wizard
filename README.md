# Forge

**A code fluency trainer.** Not an AI assistant, not a quiz app — a place to
practise writing code yourself, in a real environment, against real tests.

Runs two ways from one codebase: **in a browser**, on any free static host, and
as a **desktop app** using your real Python interpreter.

---

## The problem

Most programming education asks _"do you understand this concept?"_. Assessments
ask _"can you solve this problem?"_. AI tools ask _"can the system produce
working code for you?"_.

Forge asks:

> **Can you independently produce working code in this language?**

An engineer can understand dictionaries, loops and classes perfectly and still
be unable to write idiomatic Python without looking things up. That gap is a
measurable skill of its own, and it is what this trains.

There is no LLM in the learner experience. No generated hints, no AI
autocomplete, no chatbot, no external AI dependency.

---

## Hosting it costs nothing

The web version is static files. Python runs as WebAssembly **in the visitor's
browser**; their progress lives in **their** IndexedDB. No server executes
learner code, stores learner data, or scales with usage.

That is not a compromise — it is the strongest possible answer to the security
requirements, because a hosted deployment has no execution surface at all.

See [docs/deploying.md](docs/deploying.md) for GitHub Pages, Cloudflare Pages
and GitLab Pages.

---

## Status

|                                                                             |             |
| --------------------------------------------------------------------------- | ----------- |
| Language runtime contract, registry                                         | Done        |
| Native Python runtime (process, pytest, timeouts, process-tree kill)        | Done        |
| WebAssembly Python runtime (Pyodide, worker termination)                    | Done        |
| Both runtimes verified to agree on the whole curriculum                     | Done        |
| Exercise format, loader, catalogue, executing validator                     | Done        |
| Learning engine: attempts, fluency metrics, eight-dimension mastery         | Done        |
| Curriculum engine: spaced repetition, explainable recommendations, sessions | Done        |
| Persistence: SQLite and IndexedDB behind one contract                       | Done        |
| Web app: dashboard, skill map, adaptive workspace, command palette          | Done        |
| Desktop app (Electron)                                                      | Done        |
| Packaged installers, accounts, sync                                         | Not started |
| Second language                                                             | Not started |

7 exercises · 45 Python skills · 341 tests

---

## Run it

Node 22+. Python 3.10+ with pytest for the desktop runtime; the web version
needs neither.

```bash
npm install
npm run verify        # generate-check, lint, build, test
```

### The website

```bash
npm run web           # build packages, bundle curriculum, build site
npx vite preview --root apps/web
```

### The desktop app

```bash
npm run web
npm run build --workspace @forge/desktop
cd apps/desktop && npx electron .
```

### The toolkit

```bash
node packages/cli/dist/main.js runtime doctor
```

The doctor does not report versions — it executes code in a sandbox, trips a
timeout, and overflows an output buffer, so a pass means the isolation actually
works on your machine.

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

```bash
node packages/cli/dist/main.js exercise list
node packages/cli/dist/main.js exercise run python.collections.dict-lookup
node packages/cli/dist/main.js exercise validate     # solution passes, starter fails
node packages/cli/dist/main.js curriculum check      # graph health and coverage
node packages/cli/dist/main.js plan next             # and the arithmetic behind it
node packages/cli/dist/main.js content bundle        # curriculum as static JSON
```

---

## What a failing test looks like

Test output is a teaching surface, not a log:

```text
✕ removes two adjacent expired sessions
    Expected   ['a', 'b']
    Received   ['a']
    Likely skill: python.control.for
```

Hidden tests report only that they failed. Their assertions, values and
locations never leave the runtime boundary.

---

## Architecture

```text
LANGUAGE → Language Runtime → Workspace → Exercise Engine → Learning Engine → Skill Graph
```

The learning engine does not know whether the learner wrote Python or Rust. The
workspace does not know how mastery is calculated. The runtime does not know
which exercise invoked it.

That boundary is what let the browser version exist: it is a second runtime
adapter, not a port. `tests/cross-runtime.test.ts` runs the entire curriculum
through both and requires identical verdicts — same outcomes, same
expected/received pairs, same hidden-test redaction — because a learner on the
website and a learner on the desktop have to be measured by the same ruler.

```text
packages/
  core/         Language-neutral contracts. Nothing here knows Python exists.
  execution/    The native security boundary: sandboxes, limits, process control.
  exercises/    Exercises as data — schema, loader, catalogue, validator, bundling.
  learning/     Attempts, fluency metrics, the mastery model.
  curriculum/   Spaced repetition, recommendations, session planning.
  session/      The application layer, and the analytics behind the dashboard.
  storage/      SQLite, IndexedDB and memory behind one contract.
  runtime-web/  CPython in WebAssembly.
  cli/          Developer and authoring tooling.

languages/python/   The native adapter, the skill graph, the exercises.
apps/web/           The interface. Built once, shipped twice.
apps/desktop/       Electron shell around the same interface.
```

[docs/architecture.md](docs/architecture.md) — why it is shaped this way.
[docs/authoring.md](docs/authoring.md) — how to write an exercise.
[docs/deploying.md](docs/deploying.md) — how to host it for free.

---

## Development

```bash
npm run verify      # everything
npm test            # 341 tests
npm run generate    # re-inline the Python support files after editing them
```

`any` and `unknown` are lint errors. Trust boundaries — JSON, IPC, SQL rows —
use precise unions and typed channel maps and validate on the way in, so a
malformed input names the field it failed on instead of producing something
that looks fine and behaves strangely.

The suite includes security tests that run real processes (runaway loops,
SIGINT-proof processes, output floods, process trees, path traversal,
environment leakage) and a content gate that executes every shipped exercise —
the reference solution must pass and the starter must fail.
