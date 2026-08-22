# Architecture

This document records _why_ the code is shaped the way it is. For what exists and how to run it,
see the [README](../README.md).

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

This is not aesthetic, and it is no longer untested. There are two runtimes now: one spawns a real
interpreter, one runs CPython compiled to WebAssembly. They share the entire Python support layer —
`forge_report.py` and `forge_expect.py` run unmodified in both and emit identical structured JSON —
and `tests/cross-runtime.test.ts` puts the whole curriculum through both and requires identical
verdicts. If they ever disagreed, a learner on the website and a learner on the desktop would be
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

## 2. Executing learner code is a security boundary

Not a performance concern — a security one. Learner code is arbitrary code, and exercise content is
data that can be wrong or hostile.

**Every execution gets:**

- A disposable sandbox directory, created per run and removed afterwards even when the body throws.
- A wall-clock timeout that terminates the entire process tree. On Windows via `taskkill /T /F`; on
  POSIX by spawning detached and signalling the process group. Killing only the direct child
  reliably leaves orphans.
- A bounded output buffer. Past the cap, chunks are counted and dropped rather than accumulated, so
  an infinite `print` loop cannot exhaust the application's memory.
- An allowlisted environment. The host environment may hold API tokens and paths into the user's
  private data; none of it is inherited.
- Path validation on every workspace-relative path, rejecting absolute paths, drive letters, `..`
  segments, NUL bytes and Windows reserved device names, and verifying the resolved path stays
  inside the sandbox root.

`forge runtime doctor` verifies these behaviours by exercising them, not by asserting that the code
exists. It runs a program, trips a timeout, and floods an output buffer.

### A tradeoff worth naming

The Python runtime deliberately does **not** pass `-s` (ignore user site-packages). Better isolation
would argue for it, but `pip install --user` is the default on Windows and on many managed Python
installs, and `-s` hides the learner's own pytest. The real grading risk — a stray plugin changing
how tests run — is closed by `PYTEST_DISABLE_PLUGIN_AUTOLOAD` instead.

---

## 3. Test results are structured, never scraped

Parsing human-readable pytest output is brittle and version-dependent. Forge ships a pytest plugin
that writes a versioned JSON document, and the TypeScript side reads that.

Exercises may use `forge_expect` helpers, which raise an exception carrying the expected and
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

`forge exercise validate` executes the content:

- The reference solution must pass every test.
- The starter must **fail** at least one — otherwise the exercise asks the learner to do nothing.
- Every declared test file must actually produce test cases, catching renames and typos.
- Skills and prerequisites must exist in the graph, and an exercise may not require the skill it
  teaches.

Exercises carry a version. Attempts record the version they were made against, so editing content
cannot silently rewrite a learner's history.

---

## 5. Mastery is not one number

Eight dimensions: knowledge, recognition, recall, application, composition, speed, retention,
independence.

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
most-constrained-first, measured against the actual catalogue — filling in display order let the
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
`exercise "python.x".version: expected a number` instead of yielding a catalogue that looks fine
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

The visual brief is stated in the design itself, but the two decisions worth recording:

**The layout follows the activity.** Writing gives the editor everything; running opens the output;
a failing test opens the diagnostics wider. Panel dividers are a way of making the user do the
application's job.

**Every number answers a question about ability.** The home screen shows independent fluency and its
direction, not XP or a streak. The trajectory is replayed from the attempt log on each render rather
than snapshotted, so a change to the grading rules moves the chart and the numbers beside it
together — a stored snapshot would freeze history against whatever the rules were that day.

---

## 11. Deliberately not done yet

- **Packaged installers.** The desktop app runs; signing and notarisation are not set up.
- **Accounts and sync.** Local-only, with export/import as the transfer mechanism. The shape if it
  is ever wanted is in [deploying.md](deploying.md): opt-in, OAuth rather than passwords, snapshots
  rather than a live connection.
- **A second language.** The runtime abstraction is now tested by two Python runtimes, which is a
  real test of the boundary but not the same as a second language.
- **Knowledge and recognition grading.** Nothing currently produces evidence for those two
  dimensions; they are seeded by the onboarding prior and otherwise left alone rather than inferred
  from unrelated signals.
- **Browser end-to-end tests.** The runtime is tested against a real interpreter under Node, and the
  UI is typechecked and built, but no headless browser drives the actual screens yet.
