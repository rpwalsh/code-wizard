<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

# Architecture

This document records _why_ the code is shaped the way it is. For what exists and how to run it,
see the [README](../README.md).

---

## 0. Three kinds of thing in this repository

**`packages/`** is the platform, and knows about no language at all.

**`languages/`** holds the languages that run: a runtime implementing `LanguageRuntime`, a skill
graph, a course and its exercises. There are two — Python, with a native interpreter and a
WebAssembly one, and JavaScript on Node.

**`curricula/`** holds courses that have no runtime behind them, entirely as data — a skill graph,
a syllabus, and activities. They are practisable through activities and cannot yet be practiced
through exercises, which is the distinction the filesystem is drawing: `languages/` is where an
attempt can be _executed and judged_, and that is an engineering project rather than a writing one.
Every manifest carries a required field saying what is still missing, because "not done yet" with
no reason is indistinguishable from forgotten.

A test holds the plans to the same structural standard as the shipped course: real skill ids, an
acyclic graph, contiguous numbering, and every skill taught before it is depended on. It found
seven ordering faults the first time it ran, including two dependencies that were simply backwards.

---

## 1. The one boundary that matters

```text
              LANGUAGE
                 │
                 ▼
        ┌─────────────────┐
        │ Language Runtime│   spawn, test, format, lint, diagnose
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ Coding Workspace│   files, sandbox, limits
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ Exercise Engine │   content as data, validation
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ Learning Engine │   attempts, metrics, mastery
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ Skill Graph     │   sequencing, prerequisites
        └─────────────────┘
```

Everything above `LanguageRuntime` is language-agnostic. There is no `if (language === 'python')`
anywhere outside `languages/` and the one registry call that names the concrete runtimes.

This is not aesthetic, and it is no longer untested. There are three runtimes now, across two
languages: one spawns a real interpreter, one runs CPython compiled to WebAssembly, and one runs
JavaScript on the Node the toolkit is already running under. Adding the second language changed
nothing above the boundary — which is the only test of an abstraction that counts.

Both languages' harnesses write the same structured report, which is why that parser lives in
`packages/core` rather than with either of them: it is the wire format between a runtime and the
engine, not a fact about Python. Mutation operators go the other way and live with the language they
mutate, because "the mistakes people make" is a fact about a language. Two of the JavaScript
operators exist only because of how that language fails: `??` swapped for `||`, and `===` swapped
for `==`. They share the entire Python support layer — the
`retrainer` package (`report`, `expect`, `trace`, `diagnose`) runs unmodified in both and emits
identical structured JSON — and `tests/cross-runtime.test.ts` puts the whole curriculum through
both and requires identical verdicts.

It is a package rather than a set of prefixed top-level modules because the learner's workspace is
on `sys.path` too: a bare `trace.py` would shadow the standard library, and `report.py` or
`expect.py` would collide with anything they create. One name stays out of the way, and
`from retrainer.expect import expect_equal` reads like a library instead of like a prefix. If they ever disagreed, a learner on the website and a learner on the desktop would be
measured by different rulers, and every mastery number from either would be meaningless.

Isolation maps across without changing the contract:

|              | Native                                    | Browser                                        |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| Cancellation | process tree + `taskkill` / process group | `Worker.terminate()`                           |
| Output cap   | bounded pipe buffer                       | bounded writer inside the interpreter          |
| Workspace    | disposable temp directory                 | in-memory FS, wiped and modules purged per run |
| Path guard   | the same guard                            | the same guard                                 |

The same boundary carries storage: `ProgressStore` has SQLite, IndexedDB and memory
implementations behind one async interface, all held to one conformance suite.

---

## 1a. Fourteen languages, one implementation

Ten of the fourteen runtimes share a single implementation. `packages/toolchain` provides
`ToolchainRuntime`, which honors the whole `LanguageRuntime` contract, and each language supplies
a `ToolchainSpec` describing only what differs: which executables to look for, how to compile, how
to run, and how to run the tests.

The observation behind it: ten languages that compile or interpret a file in a sandbox and produce
a structured report differ in about forty lines each and are identical in the four hundred around
them. Written ten times, that is ten subtly different timeout behaviors and one language where an
output flood is not capped.

### A missing toolchain is a reported state, never an exception

Most people do not have Go, Rust, a C compiler, the .NET SDK and PHP installed at once. So every
toolchain-backed language declares what it needs, discovery is cached and first-class, and the
result flows into `doctor` and into every execution path. A learner who opens the Rust course
without Rust gets one sentence naming the tool and where to get it — not a spawn error.

`doctor` then goes further and **compiles and runs a trivial program**. A compiler on PATH and a
machine that can execute code are different claims: LLVM installed on Windows with no Visual Studio
Build Tools satisfies the first and fails the second, and it is the commonest real configuration
problem there is. The smoke test is the only check that notices, and it maps three known failure
signatures — no libraries to link against, missing standard headers, a sandbox on a noexec volume —
onto the specific fix.

### Two environments, one boundary

Learner code runs in the locked-down sandbox environment: nothing inherited, no PATH, no home
directory. Compilers, formatters and linters run with PATH and the variables a toolchain manager
needs, because they are software the machine's owner installed rather than code the learner wrote.

Conflating the two gives you either a compiler that cannot run or a sandbox that is not one. The
first version did conflate them, and the symptom was `dotnet build failed with no output` — the
process started, could not find its own runtime, and died before it could say so.

### The report is the contract

Every language writes the same structured JSON document. Most get a harness written in the language
itself — one C header, one C# file, one PHP file, one Python module for SQL, the JavaScript harness
reused for TypeScript, Node, React and Angular. Go and Rust already ship good test runners that
emit machine-readable output, so those are converted instead: reimplementing `go test` in Go so it
wrote our format would be more code and a worse tool.

Where the thing that ran is not the thing that was written — React's `.tsx` is compiled to `.js`
before it executes — `mapReportFile` maps the paths back. That is not cosmetic: a test file's
visibility is keyed on its declared path, so an unmapped hidden test would have its results shown
in full.

---

## 2. Executing learner code is a security boundary

Not a performance concern — a security one. Learner code is arbitrary code, and exercise content is
data that can be wrong or hostile.

**Every execution gets:**

- A disposable sandbox directory, created per run and removed afterwards even when the body throws.
- A wall-clock timeout that terminates the entire process tree. On Windows via `taskkill /T /F`; on
  POSIX by spawning detached and signaling the process group. Killing only the direct child
  reliably leaves orphans.
- A bounded output buffer. Past the cap, chunks are counted and dropped rather than accumulated, so
  an infinite `print` loop cannot exhaust the application's memory.
- An allowlisted environment. The host environment may hold API tokens and paths into the user's
  private data; none of it is inherited.
- Path validation on every workspace-relative path, rejecting absolute paths, drive letters, `..`
  segments, NUL bytes and Windows reserved device names, and verifying the resolved path stays
  inside the sandbox root.

`code-retrainer runtime doctor` verifies these behaviors by exercising them, not by asserting that the code
exists. It runs a program, trips a timeout, and floods an output buffer.

### A tradeoff worth naming

The Python runtime deliberately does **not** pass `-s` (ignore user site-packages). Better isolation
would argue for it, but `pip install --user` is the default on Windows and on many managed Python
installs, and `-s` hides the learner's own pytest. The real grading risk — a stray plugin changing
how tests run — is closed by `PYTEST_DISABLE_PLUGIN_AUTOLOAD` instead.

---

## 3. Test results are structured, never scraped

Parsing human-readable pytest output is brittle and version-dependent. Code Retrainer ships a pytest plugin
that writes a versioned JSON document, and the TypeScript side reads that.

Exercises may use `retrainer.expect` helpers, which raise an exception carrying the expected and
received values as separate fields. That is what lets the panel show

```text
Expected:  ['a', 'b']
Received:  ['a']
Relevant concept: python.control.for
```

instead of a traceback.

Hidden-test redaction happens **at the runtime boundary**, in `redactHiddenTests`, not in the UI. No
presentation code can forget to apply it.

---

## 4. Exercises are data

An exercise is a directory: `exercise.yaml` beside real `starter/`, `solution/` and `tests/` files.
Authors edit Python with Python tooling; the manifest carries metadata, visibility, hints and the
explanation.

Adding an exercise never requires changing application code.

`code-retrainer exercise validate` executes the content:

- The reference solution must pass every test.
- The starter must **fail** at least one — otherwise the exercise asks the learner to do nothing.
- Every declared test file must actually produce test cases, catching renames and typos.
- Skills and prerequisites must exist in the graph, and an exercise may not require the skill it
  teaches.

Exercises carry a version. Attempts record the version they were made against, so editing content
cannot silently rewrite a learner's history.

---

## 4a. Activities are the half that needs no runtime

An exercise needs an interpreter. An activity needs a reader.

`packages/activities` defines six kinds — multiple choice, predict the output, order the lines,
fill the gaps, spot the bug, match the pairs — each of which is **graded by comparison against an
answer the author wrote down**. There is no scoring model, no similarity threshold and no
interpretation, so the same activity and the same response produce the same grade on every machine.
That is the property that lets a number derived from them mean anything.

This is the reason fifteen curricula with no toolchain behind them are nonetheless practisable
today. Content lives in `curricula/<id>/activities/*.yaml`, is validated on load, and is checked
again in CI — because a wrong answer key is the one content failure with no visible symptom: the
activity loads, renders, and silently marks correct answers wrong.

### The ceiling is the load-bearing part

Activities may move `knowledge`, `recognition`, `recall` and `debugging`. They may **never** move
`application`, `composition`, `transfer`, `independence`, `speed` or `retention`, and no individual
answer is worth more than `ACTIVITY_CEILING` (0.65) toward the dimensions they can reach.

That is not a style guide. Recognizing a correct answer among four is not evidence that you could
produce it from an empty editor, and without the ceiling a language with a hundred questions and no
runtime would report full mastery while nobody had ever executed a line of it — which is precisely
the flattering progress bar this product exists to replace. `dimensionsByKind` is data,
`unreachableByActivities` is data, and a test asserts they never intersect.

Reaching past the ceiling requires writing code that passes tests. There is no other route.

---

## 5. Mastery is not one number

Ten dimensions: knowledge, recognition, recall, application, composition, debugging, transfer,
speed, retention, independence.

The product exists because these come apart. A senior engineer can score high on knowledge and
recognition for Python dictionaries and near zero on recall — they know exactly what they want and
have to look up how to write it. Collapsing that into one score would hide the only thing worth
measuring.

Two consequences run through the code:

**Grading separates _did it work_ from _did you do it alone_.** An assisted solve scores full marks
on application and zero on independence. Recall is scaled by the _deepest_ hint reached, not the
count: a conceptual nudge costs almost nothing, being handed the answer costs almost everything.
Reading the reference solution zeroes the attempt's evidence weight entirely. A failure, by
contrast, is never discounted — being unable to do it is unambiguous however much help was
available.

**Recall separates producing code from completing it.** A starter skeleton answers half the
question before it is asked — which shape, which signature, which imports — so a solve with it in
the editor is capped below the top of the dimension. Only the rungs that hand over an empty file
can reach it, and the reason attached to the observation names the next rung rather than only the
gap.

**Debugging and transfer are graded from different things than the rest.** Debugging comes from a
red-to-green transition, scaled by how many red runs it took, or directly from a bug-fix exercise.
Transfer needs history rather than the attempt: it counts only the first time an exercise is seen,
and only when its skills were practiced elsewhere first. That history is derived from the attempt
log at grading time, so changing what counts as prior experience re-reads it rather than needing it
to have been recorded differently.

**Knowledge is earned only by prediction.** Saying in advance what the machine will do, and being
right, is the one signal in the system that distinguishes understanding the code from the code
happening to work — and the only way an onboarding claim can be corrected downward by reality.

**Two things are measured against the learner's own past rather than a scale.** The personal
baseline is the reading over their first attempts, derived from the log rather than stored — a
frozen snapshot would be a derived value pretending to be evidence, stranded the moment the scoring
model improves. Assistance dependency is the share of recent attempts that used a hint, the
documentation or the answer, over a trailing window; for someone rebuilding fundamentals it is the
chart that answers the actual question, and days with no practice draw nothing rather than dropping
to zero.

**A claim to already know something is neither refused nor trusted.** `planDemonstration` picks the
hardest unseen exercise for the skill and runs it on the blank-page rung — completing a skeleton
would show recognition, which is exactly what an experienced programmer already has.
`judgeDemonstration` is stricter than ordinary grading, because the cost of a false pass is that the
learner skips material they needed: it requires a solve that is unaided _and_ inside a generous time
budget. Passing credits the skill and everything beneath it; the prerequisites are credited on
`readiness` only, with `observations` left at zero, so they stop gating the learner without
claiming anyone measured them. Credit is applied upward only.

**Readiness is a different question from mastery.** Whether a prerequisite is satisfied well enough
to _attempt_ dependent work is weighted toward knowledge, recognition and application; headline
mastery is weighted toward independent recall. Gating on mastery would refuse to teach anyone
anything until they had already learned it elsewhere — an early version of the recommender did
exactly that and locked every experienced learner out of the whole graph.

---

## 6. Every recommendation shows its arithmetic

The recommender produces named, signed factors that sum to the score. No hidden weights, no model,
no randomness:

```text
python.collections.dict-lookup score 52
  +35  python.collections.dict-lookup is at 12% mastery
  +20  not attempted yet
   -3  difficulty 2 against a level of 1.5
```

Blocked exercises are reported with what is blocking them, rather than quietly omitted. A learner
who cannot see why something is unavailable cannot do anything about it.

Session planning fills a fixed shape (recall / review / focused / system) rather than taking the top
N, so a learner whose weakest area is one skill still gets a varied session. Slots fill
most-constrained-first, measured against the actual catalog — filling in display order let the
permissive review slot swallow the one bug-fix the focused slot needed.

---

## 7. Training data is not assessment data

A learner who used twenty hints and eventually solved an exercise has not demonstrated the same
thing as one who solved it unaided in two minutes. The attempt record keeps the full event log —
runs, test results, hint reveals, documentation lookups, pauses — so the distinction survives, and
metrics are _derived_ from that log rather than stored alongside it. Changing how a metric is
defined re-derives history instead of invalidating it.

---

## 8. Persistence

`node:sqlite`, which ships with Node 22+ and with Electron. No native module means no per-platform,
per-Electron-version rebuild.

WAL journalling, foreign keys on, migrations that bump the schema version inside the same
transaction that applies them, and attempts written atomically with their events. Transactions are
re-entrant via savepoints, because methods that write atomically need to be callable from other
methods that do.

A corrupt mastery vector resets that one skill. An unopenable database would lose everything, so
robustness is preferred to strictness at the read boundary.

---

## 9. Types at the boundaries

`any` and `unknown` are lint errors, not conventions.

That is a stronger constraint than it first appears, because `unknown` is where deferred typing
hides, and deferred typing has a habit of never happening. Removing it meant replacing assertions
with validation at every boundary — parsed JSON, IPC payloads, SQL rows, the WASM bridge — and in
every case the result was better than what it replaced. A truncated content bundle now says
`exercise "python.x".version: expected a number` instead of yielding a catalog that looks fine
and behaves strangely.

The mechanisms:

- **`JsonValue`** — a precise union for parsed data. `JSON.parse` is declared as returning `any`,
  which silently switches off checking for everything downstream.
- **Typed channel maps** — one contract shared by Electron's preload, main process and renderer.
  The preload's whitelist is generated from it, so a channel cannot be called before it is allowed.
- **Result maps** — the worker protocol keys results by request kind, so no caller declares what it
  expects.
- **Column readers** — SQL rows are read field by field, so a schema that drifts names the column.

The one exception is `toError()`, because a `catch` binding is `unknown` by language rule and the
only alternative TypeScript offers is `any`.

---

## 10. The interface is an instrument

**The layout follows the activity.** Writing gives the editor everything; running opens the output;
a failing test opens the diagnostics wider. Panel dividers are a way of making the user do the
application's job.

**Every number answers a question about ability.** The home screen shows independent fluency and its
direction, not XP or a streak. The trajectory is replayed from the attempt log on each render rather
than snapshotted, so a change to the grading rules moves the chart and the numbers beside it
together — a stored snapshot would freeze history against whatever the rules were that day.

**Surfaces are glass over a drawn landscape, in two themes.** The scene is vector, authored in
`apps/web/src/components/Backdrop.tsx`, because a photograph would need a license trail that cannot
be verified from inside the repository and would be the one thing in the product that has to be
fetched. Every color is a custom property, so one geometry serves both themes.

Glass costs contrast, and contrast is what makes dense information readable for hours, so the
regions that are read for minutes at a time — editor, test output, trace, terminal — opt out and sit
on opaque surfaces. Appearance has three states, not two: light, dark, and following the system,
which is the default. Monaco cannot read custom properties, so the editor watches both the media
query and the root attribute rather than being told once at startup.

**Screenshots are generated from the production bundle.** `npm run screenshots` drives the real
build with Playwright and writes `docs/images`. A documentation image made by hand drifts the first
time anything moves and nobody notices, because nobody re-renders a picture.

---

## 11. Content is a graded artifact, not a folder

Exercises are checked four ways, and each gate exists because of a specific failure this kind of
project has.

`validate` executes every exercise: the reference solution must pass and the starter must fail.
`mutate` breaks the reference solution on purpose and requires the tests to notice, because a suite
that accepts a wrong answer tells the learner they were right and every mastery number downstream
inherits that. The cross-runtime test requires both interpreters to reach identical verdicts on the
whole curriculum. And the syllabus check reports the gap between the planned course and what has
actually been written, counting a lesson only when _every_ skill it names has content — an earlier
version counted a lesson done when one of its three skills was covered and cheerfully reported 37%
when ten exercises existed.

Faults that no input can detect are recorded in the exercise manifest with a required reason and an
optional line number. Without somewhere to record them the score can never reach 100%, the gate
stays permanently red, and people stop reading it.

---

## 12. Deliberately not done yet

- **Packaged installers.** The desktop app runs; signing and notarisation are not set up.
- **Accounts and sync.** Local-only, with export/import as the transfer mechanism. The shape if it
  is ever wanted is in [deploying.md](deploying.md): opt-in, OAuth rather than passwords, snapshots
  rather than a live connection.
- **JavaScript in the browser.** The JavaScript runtime runs on Node, so it works on the desktop
  and not on the website. What it needs is module resolution without a filesystem: the specifiers a
  test file writes have to become blob URLs before anything can be imported. The harness is already
  split into a runner that knows nothing about files and a Node entry point that does, which is the
  half of that work worth doing early.
- **Runtimes for the planned curricula.** Sixteen courses are designed and none can be practiced.
  See `curricula/`, where each one states what specifically is missing.
- **Recognition grading.** Nothing currently produces evidence for it; it is seeded by the
  onboarding prior and otherwise left alone rather than inferred from unrelated signals. Knowledge
  used to be in the same position and is now earned by prediction.
- **Language friction.** Comparing how long the same idea takes in two languages needs a second
  language runtime first.
