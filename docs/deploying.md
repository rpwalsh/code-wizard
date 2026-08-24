<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

# Deploying

Code Wizard ships twice from one build: a static site anyone can host for nothing, and
a desktop app. The code is identical; only the `Platform` differs.

---

## Why the web version costs nothing to run

The site is files. Python runs as WebAssembly **in the visitor's browser**, and
their progress lives in **their** IndexedDB. No server ever executes learner
code, stores learner data, or scales with the number of users.

Three hundred learners is three hundred browsers doing their own work. There is
nothing to pay for and nothing to fall over.

That is also the strongest possible answer to the security section of the spec:
the isolation is the browser's, and a hosted deployment has no execution
surface at all.

---

## GitHub Pages

Already wired up in [.github/workflows/deploy.yml](../.github/workflows/deploy.yml).

1. **Settings → Pages → Source: GitHub Actions.**
2. Push to `main`.

The workflow builds the packages, bundles the curriculum, builds the site and
publishes it. The bundling step **refuses to emit while any exercise is
broken**, so bad content fails the deploy rather than shipping a hole in the
catalog.

Assets use relative URLs, so it works at `user.github.io/code-wizard/` without
configuration.

---

## Cloudflare Pages

No workflow needed. In the Cloudflare dashboard, Workers & Pages → Create →
Pages → connect to Git, pick the repository, and set:

| Setting             | Value                   |
| ------------------- | ----------------------- |
| Framework preset    | None                    |
| Build command       | `npm ci && npm run web` |
| Output directory    | `apps/web/dist`         |
| Node version        | `22`                    |

Then Custom domains → Set up a custom domain. If the domain's nameservers are
already Cloudflare's, the record is created for you and certificates issue in
a few minutes.

Two things about the build worth knowing before the first one fails.

It is not a small build. The output is around a hundred megabytes, because
the Python interpreter and both PHP engine builds ship with the site. That is
inside the Pages limit for total files but well above the 25 MB **per file**
limit — nothing here exceeds it, the largest single file being the PHP wasm
at about 19 MB, but check before adding anything larger.

`_headers` is generated into the output by the Vite build rather than
committed, from the same constant that writes the meta tag in `index.html`
([apps/web/security-policy.ts](../apps/web/security-policy.ts)). Two
hand-maintained copies of a content security policy drift, and the one that
drifts is the one nobody reads. Cloudflare applies it as real response
headers, which covers responses that are not HTML; GitHub Pages ignores the
file, harmlessly.

### From the command line instead

```bash
npm run web
npx wrangler pages deploy apps/web/dist --project-name code-wizard
```

The first run opens a browser to authorize, or reads `CLOUDFLARE_API_TOKEN`
from the environment if you would rather not.

---

## GitLab Pages

Add `.gitlab-ci.yml`:

```yaml
pages:
  image: node:22
  script:
    - npm ci
    - npm run web
    - mv apps/web/dist public
  artifacts:
    paths: [public]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

---

## What a visitor downloads

|                    | Size (gzipped) | When                                   |
| ------------------ | -------------- | -------------------------------------- |
| App shell + styles | ~4 KB          | first load                             |
| Application        | ~134 KB        | first load                             |
| Monaco editor      | ~849 KB        | first load, then cached                |
| Curriculum         | ~20 KB         | first load, revalidated                |
| Pyodide + CPython  | ~11 MB         | first _run_, from the CDN, then cached |

The interpreter is fetched from `cdn.jsdelivr.net` at a pinned version rather
than vendored. Vendoring would add ~30 MB to the repository and the deploy for
files that are already on a CDN, immutable per version, and shared with every
other Pyodide site the visitor has loaded.

The dashboard is usable while Python downloads in the background; only pressing
Run has to wait.

---

## The desktop app

```bash
npm run build          # packages
npm run bundle         # curriculum
npm run build --workspace @code-wizard/web
npm run build --workspace @code-wizard/desktop
cd apps/desktop && npx electron .
```

`npm run dev --workspace @code-wizard/desktop` runs it against the Vite dev server
instead, for UI work.

The desktop build uses your **real** Python interpreter, which is faster than
WebAssembly and is the environment you actually ship code in. It also reads
exercise _directories_ when they exist, so it doubles as the authoring tool:
edit an exercise, restart, see it.

Packaging installers (electron-builder, signing, notarisation) is not set up
yet.

---

## Give it an origin of its own

A requirement, not a preference. Browser storage is scoped by hostname and not
by path, so every project published under the same account on a shared static
host shares one storage area, and any page there can read this application's
progress database.

It is all first-party code, so nothing escapes — but "isolated to this app" is
weaker than it sounds, and the fix costs nothing: a project subdomain, or a
custom domain. Do that before a public deployment.

## Progress, accounts and sync

There are none, deliberately.

Progress is local. Export and import are already implemented, so moving to
another machine is a file rather than a service.

### Sign-in was considered and declined

Not postponed — decided. Third-party sign-in was costed out and rejected, and
this section records why so the question does not get reopened by someone who
assumes it was simply never looked at.

The cost of an account is not the login screen. It is a database of people that
somebody now runs: a provider id tied to a learning history, a backup story, a
migration story, and a breach surface that exists even when the table has four
rows in it. All of that is permanent work, for a project that charges nothing.

The benefit it buys is cross-device sync. Export and import already do that with
a file.

See [data.md](data.md) for what is stored and the tests that keep it there.

### If that were ever revisited

The shape is settled, which is part of why it is safe to decline now.
`ProgressStore` is an interface, so sync is a decorator that wraps the local
store and pushes snapshots — no change to anything above it. Three rules would
have to hold:

- **Opt-in.** Someone trying the site must not have an account created for them,
  and everything must keep working for a learner who never signs in.
- **No passwords.** Delegated sign-in needs no password storage, no reset flow
  and no email service, and the only field worth keeping is an opaque provider
  id.
- **Deletable.** An account that cannot be removed from the account screen is
  worse than no account, and export must keep working without one.

At roughly two snapshot writes per learner per day, a few hundred learners sit
around 600 writes a day, which fits inside the free tier of a hosted SQLite
service and would run the schema in `packages/storage` unchanged. The
engineering was never the obstacle.
