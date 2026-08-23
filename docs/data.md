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

**In the browser:** an IndexedDB database named `code-retrainer-progress`,
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

## How far the enforcement actually reaches

Each of these is a case the checks above do not cover. None of them is data
going somewhere today; all of them are the distance between what a test proves
and what its name suggests.

**The static check reads source, not the shipped bundle.** The built output
contains `cdn.jsdelivr.net` twice — Monaco's editor loader default and
Pyodide's package fallback. Both are overridden
([Editor.tsx](../apps/web/src/components/Editor.tsx) pins Monaco to the bundled
copy, [web.ts](../apps/web/src/platform/web.ts) points Pyodide at the vendored
files), so neither is ever fetched. But they are switched off by configuration,
not by absence: drop one of those lines in a refactor and the editor quietly
pulls three megabytes from a CDN, with the static check none the wiser, because
the URL is in a dependency rather than in `apps/web/src`.

**The URL pattern misses protocol-relative addresses.** `//example.com/x` is a
valid absolute URL with the scheme omitted; the pattern requires `http(s)://`
and lets it through. That is the honest-mistake case these guards exist for.

**Browser storage is scoped by origin, which means hostname, not path.** On a
shared static-hosting domain, every project published under the same account
shares one origin and can read this application's database. It is all
first-party code, so nothing escapes — but "isolated to this app" is a weaker
statement than it sounds, and it argues for a dedicated subdomain before any
public deployment.

**The runtime check covers one flow.** It proves a Python run makes no outside
request. It does not sweep every screen. "Makes no requests" is proven for that
path and inferred for the rest.

**Server logs exist at the hosting layer.** Whoever serves the files keeps their
own request logs — addresses, timestamps, paths — the same as any website. The
application neither reads them nor adds to them, and nothing in this repository
changes them. The desktop build is served from nowhere and makes no requests at
all.
