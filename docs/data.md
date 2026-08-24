<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

# Where the data lives

There is no server, no account, and no network call that carries anything a
learner did. This document says what is stored, where it sits, how that is
enforced rather than promised, and — at the end — exactly how far the
enforcement reaches, because a guard is only worth what its narrowest case is
worth.

---

## What is stored

| Data | Purpose |
| --- | --- |
| Attempts: code written, tests passed, time taken | Measuring fluency over time |
| Skill mastery vectors | Deciding what to teach next |
| Review schedule | Spacing practice |
| Settings: language, theme, teaching mode, tour dismissal | Preferences |

**In the browser:** an IndexedDB database named `code-wizard-progress`,
scoped by the browser to the origin serving the page.

**On the desktop:** a SQLite file named `progress.db` in the per-user
application data directory ([apps/desktop/src/main.ts](../apps/desktop/src/main.ts)).

No cookies. No `localStorage`, no `sessionStorage`, no service worker.

That last point is a design decision, not a coincidence. `localStorage` is a
synchronous five-megabyte string bucket, an attempt carries its whole event log,
and it is the first thing a "clear cookies" sweep takes. More usefully:
everything living in one store is what makes export, import, and erasure each
act on *all* of it rather than on most of it. A second storage location is a
second thing for those three operations to forget.

---

## What leaves the device

Nothing. The application makes two network requests, both for its own bundled
files, both relative to the page serving them:

- `content/activities.json` — the practice questions
- the exercise catalog

Both are downloads, not uploads. Python runs as WebAssembly in the page, so
code a learner writes is executed on their own machine and never sent anywhere
to be run.

### Three checks, at three levels

All in `npm run verify`:

1. **Static.** A test walks every TypeScript, TSX, CSS, and HTML file in the
   browser application and fails on an absolute `http(s)://` URL outside a
   comment ([tests/principles.test.ts](../tests/principles.test.ts)). A build
   that names no external host cannot reach one. Adding a hosted font or an
   error reporter breaks this on purpose, so the decision gets made rather than
   arriving with a dependency.
2. **Dependency.** A separate test fails if an analytics, payment, telemetry, or
   model-client package appears in a manifest or in the installed tree.
3. **Runtime.** An end-to-end test drives a real browser through a real Python
   run, records every request the page makes, and fails if one is addressed
   anywhere but the local test server
   ([apps/web/e2e/script-runtime.spec.ts](../apps/web/e2e/script-runtime.spec.ts)).

They are independent on purpose: a mistake has to defeat all three at different
levels to ship.

---

## Moving and removing it

"Your data stays on this device" in the footer opens one panel with three
actions:

- **Save a copy** — writes everything to a JSON file, assembled in the page and
  handed to the browser's download mechanism. This is how a second machine gets
  set up, since there is no sync.
- **Load a copy** — reads one back, replacing what is on the device.
- **Delete everything** — two deliberate steps, escapable at the first,
  irreversible at the second.

Deletion is implemented as an import of an empty snapshot
([apps/web/src/platform/transfer.ts](../apps/web/src/platform/transfer.ts)), so
it runs through the code that already knows the name of every collection. A
collection added later cannot be missed by erasure without also being missed by
export, which fails its own tests. Delete routines rot when they are a second
hand-maintained list; this one cannot drift.

An end-to-end test erases, reloads, and asserts the app has forgotten enough to
ask which language you want all over again — which can only pass if the stored
answer is gone rather than hidden.

---

## What enforces it

Five checks, at four levels. They are independent on purpose: a mistake has to
defeat all of them to ship.

**The browser refuses.** The production build carries a Content Security Policy
with no host in any directive
([apps/web/security-policy.ts](../apps/web/security-policy.ts)). Every way a
page can speak to a server — fetch, XHR, WebSocket, EventSource, sendBeacon,
an image, an injected script — is governed by it, and a request off this origin
is refused before it is made, whoever wrote the code that asked. Every
relaxation in the policy is a scheme rather than a host, so none of them can
name somewhere else.

That is the check that matters, because it holds for code this repository did
not write. The rest exist so a regression is caught early and named precisely.

1. **No external address in the source.** Every TypeScript, TSX, CSS and HTML
   file in the browser app, checked for absolute *and* protocol-relative URLs —
   `//example.com` is a complete address with the scheme left off, and it is
   the form somebody writes by accident.
2. **No new external host in the shipped bundle.** The built output is scanned
   against a recorded list. Two entries on it are real: the editor's loader and
   the Python runtime both default to a CDN and are both pointed at bundled
   copies instead. They are unreachable under the policy above, and this check
   exists so the day a dependency adds a telemetry endpoint, the build fails and
   somebody reads the diff.
3. **No dependency that would want to phone home.** No analytics, payment,
   telemetry or model-client package in any manifest or in the installed tree.
4. **The policy is enforced, not merely present.** A browser test asks the page
   to fetch, to load an image, and to inject a script from another origin, and
   asserts the browser raised a policy violation for each. The first version of
   that test passed with the policy removed — a cross-origin request fails on
   its own — so it now watches for the violation event itself, which fires only
   when a policy refuses something.
5. **No screen talks to anyone.** A browser test walks the whole application —
   dashboard, skill map, practice, an answered activity, the data panel, the
   workspace, a real test run — with a request recorder attached throughout, and
   fails on a single request off this origin.

## The one thing outside the software

Whoever serves the files keeps their own web server logs: addresses,
timestamps, paths, the same as any website. The application neither reads them
nor adds to them, and nothing in this repository changes them.

Two consequences worth acting on. Browser storage is scoped by hostname rather
than by path, so a deployment must have an origin of its own — on shared static
hosting, every project under the same account shares one storage area. And the
desktop build is served from nowhere and makes no requests at all, which is the
option when even a server log is too much.
