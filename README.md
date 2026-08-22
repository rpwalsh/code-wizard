# Code Retrainer

**A code fluency trainer.** Not an AI assistant, not a quiz app — a place to
practise writing code yourself, in a real environment, against real tests.

Runs two ways from one codebase: **in a browser**, on any free static host, and
as a **desktop app** using your real Python interpreter.

---

## The problem

Most programming education asks _"do you understand this concept?"_. Assessments
ask _"can you solve this problem?"_. AI tools ask _"can the system produce
working code for you?"_.

Code Retrainer asks:

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
| Learning engine: attempts, fluency metrics, ten-dimension mastery           | Done        |
| Withdrawal ladder: learn → practice → fluency → blank page → simulation     | Done        |
| Curriculum engine: spaced repetition, explainable recommendations, sessions | Done        |
| Persistence: SQLite and IndexedDB behind one contract                       | Done        |
| Web app: dashboard, skill map, adaptive workspace, command palette          | Done        |
| Desktop app (Electron)                                                      | Done        |
| Packaged installers, accounts, sync                                         | Not started |
| Second language                                                             | Not started |

10 exercises · 45 Python skills · 456 tests

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
npm run build --workspace @code-retrainer/desktop
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
Code Retrainer Runtime Diagnostics — Python
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
npm test            # 456 tests
npm run generate    # re-inline the Python support files after editing them
npm run typecheck   # the packages and both apps
code-retrainer exercise mutate   # would the tests catch a wrong answer?
```

`any` and `unknown` are lint errors. Trust boundaries — JSON, IPC, SQL rows —
use precise unions and typed channel maps and validate on the way in, so a
malformed input names the field it failed on instead of producing something
that looks fine and behaves strangely.

The suite includes security tests that run real processes (runaway loops,
SIGINT-proof processes, output floods, process trees, path traversal,
environment leakage) and a content gate that executes every shipped exercise —
the reference solution must pass and the starter must fail.

---

## Status

Single maintainer, no support, no contributions, no warranty. Nothing here is
guaranteed to be correct, to keep working, or to keep existing. Use it at your
own risk and read [CONTRIBUTING.md](CONTRIBUTING.md) before opening anything.

What _is_ guaranteed is the part that matters: it stays free for learners,
it runs offline, it never phones home, and there is no AI in it.

---

## Licence

Two licences, protecting different things.

**The software** — `packages/`, `apps/`, `languages/*/src`, `languages/*/runtime`,
`scripts/`, `tests/` — is under the
[PolyForm Noncommercial License 1.0.0](LICENSE.md). Personal use, research,
schools, universities, public research bodies and government are all covered.
Commercial use needs a separate written licence.

**The curriculum** — the exercises, skills, prompts, hints and tests under
`languages/*/exercises` — is [licensed separately](CONTENT-LICENSE.md) and is
not open content. You may read all of it and learn from all of it, offline and
free and without asking anyone. Copying, modifying, translating or selling it
needs permission.

The reasoning is in [PRINCIPLES.md](PRINCIPLES.md) §10: the exercises, the skill
graph and the mastery model are one calibrated instrument, and a fork that
changes the exercises while keeping the scoring produces numbers that look
comparable and are not.

**Nothing here restricts a learner.** That is the point of the split.
