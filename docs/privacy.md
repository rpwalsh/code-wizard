<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

# Data handling

**This is a technical description, not legal advice, and not a privacy policy.**
It is written so that a lawyer can read it and decide what notice, if any, this
project needs. Nobody involved in writing it is qualified to tell you whether it
satisfies the GDPR, the CCPA and its amendments, or anything else. Have counsel
review it before publishing a policy that rests on it.

The facts below are checked by tests in this repository, and each claim names
the test that enforces it. If a claim here is ever false, a build fails.

---

## The short version

There is no server. There is no account. Nothing a learner does is transmitted
anywhere, because the application contains no address to transmit it to.

The operator of a deployment never receives learner data, and so has none to
disclose, export, sell, breach, or delete on request.

---

## What is stored, and where

Everything is stored on the learner's own machine.

| Data | Purpose | Where it lives |
| --- | --- | --- |
| Attempts (code written, tests passed, time taken) | Measuring fluency over time | On device |
| Skill mastery vectors | Deciding what to teach next | On device |
| Review schedule | Spacing practice | On device |
| Settings (language, theme, teaching mode, whether the tour was dismissed) | Preferences | On device |

**In the browser:** an IndexedDB database named `code-retrainer-progress`, scoped
by the browser to the origin serving the page. Other sites cannot read it. It is
removed by the browser's own "clear site data" control, like any other site
storage.

**On the desktop:** a SQLite file named `progress.db` in the operating system's
per-user application data directory
([apps/desktop/src/main.ts](../apps/desktop/src/main.ts)). It is an ordinary
file, and the person who owns the machine owns it.

No cookies are set. `localStorage` and `sessionStorage` are not used, and there
is no service worker. This is not an accident of style: progress is deliberately
kept in one place so that export, import, and erasure each act on all of it
rather than on most of it.

---

## What leaves the device

Nothing.

The application makes exactly two network requests, both for its own bundled
files, both relative to the page they are served from:

- `content/activities.json` — the practice questions
- the exercise catalog

Both are static assets sitting next to the page, requested the same way the page
requests its own stylesheet. Neither carries learner data — they are downloads,
not uploads.

Python runs inside the browser as WebAssembly. Code a learner writes is executed
on their own machine and is never sent anywhere to be run.

### How that is enforced rather than promised

Three independent checks, at three different levels, all in `npm run verify`:

1. **No external address exists in the source.** A test walks every TypeScript,
   TSX, CSS, and HTML file in the browser application and fails if any of them
   contains an absolute `http://` or `https://` URL outside a comment
   ([tests/principles.test.ts](../tests/principles.test.ts)). A build that names
   no external host cannot reach one. Adding a hosted font, an icon set, or an
   error reporter breaks this test on purpose, so that the decision is made
   deliberately and not by a dependency.
2. **No dependency that would want to phone home.** A separate test fails if any
   analytics, payment, telemetry, or model-client package appears in a manifest
   or in the installed tree.
3. **Nothing goes out at runtime.** An end-to-end test drives a real browser
   through a real Python run, records every request the page makes, and fails if
   a single one is addressed anywhere but the local test server
   ([apps/web/e2e/script-runtime.spec.ts](../apps/web/e2e/script-runtime.spec.ts)).

---

## What the person hosting the files can see

This is the one place data about a visitor exists, and it has nothing to do with
the application.

A static host — whoever serves the files — keeps its own web server logs, which
typically record IP addresses, timestamps, requested paths, and user agents.
That is true of every website, and it happens at the hosting layer whether or not
the page served does anything at all.

The application neither reads those logs nor adds to them. Anyone publishing a
deployment should read their host's own terms and privacy documentation, since
those logs are the host's processing, on the host's infrastructure, under the
host's retention policy.

If a deployment needs to avoid even that, the desktop application is served from
nowhere and makes no requests.

---

## What a learner can do with their data

All three actions are in the command palette, and all three work offline:

- **Save a copy.** Writes the complete history to a JSON file the learner
  chooses. It never passes through a server; the file is assembled in the page
  and handed to the browser's download mechanism.
- **Load a copy.** Reads such a file back, replacing what is on the device. This
  is how a second machine is set up, since there is no sync.
- **Delete everything.** Removes every attempt, measurement, and preference from
  the device. It is irreversible, is behind a confirmation that says so, and
  offers to save a copy first
  ([apps/web/src/platform/transfer.ts](../apps/web/src/platform/transfer.ts)).

Deletion is implemented as an import of an empty snapshot, so it uses the same
code path that already knows the name of every collection. A future collection
cannot be forgotten by the erasure routine without also being forgotten by
export, which would fail its own tests.

---

## Children

No age is asked for, because no account exists and no data is collected. The
material is written to be usable by a beginner of any age, and a ten-year-old
using it produces exactly the same amount of transmitted data as anyone else:
none.

---

## Questions worth putting to counsel

Listed because they are the ones a non-lawyer can see the shape of, not because
this document has a view on them:

- Whether storing preferences and progress on a visitor's own device, with no
  identifier and no transmission, counts as strictly necessary for a service the
  visitor explicitly requested, and what that means for consent requirements
  covering storage on terminal equipment.
- Whether operating a static deployment makes the operator a controller of the
  host's server logs, and what notice that would require.
- Whether the absence of any collection changes what a policy must still say out
  loud in order to say it credibly.
- What, if anything, needs to be published at all for a site that has no
  server-side component.

The honest position is that this project is trying to have as little to answer
for as it is possible for a piece of software to have, and would rather over-
document that than assume it.
