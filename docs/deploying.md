# Deploying

Code Retrainer ships twice from one build: a static site anyone can host for nothing, and
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
catalogue.

Assets use relative URLs, so it works at `user.github.io/code-retrainer/` without
configuration.

---

## Cloudflare Pages

No workflow needed — connect the repository and set:

| Setting          | Value                   |
| ---------------- | ----------------------- |
| Build command    | `npm ci && npm run web` |
| Output directory | `apps/web/dist`         |
| Node version     | `22`                    |

[apps/web/public/\_headers](../apps/web/public/_headers) is committed and
Cloudflare applies it automatically: a content security policy that permits
WebAssembly and the pinned Pyodide CDN and nothing else, plus immutable caching
for hashed assets and short caching for the curriculum.

GitHub Pages ignores that file, which is harmless.

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
npm run build --workspace @code-retrainer/web
npm run build --workspace @code-retrainer/desktop
cd apps/desktop && npx electron .
```

`npm run dev --workspace @code-retrainer/desktop` runs it against the Vite dev server
instead, for UI work.

The desktop build uses your **real** Python interpreter, which is faster than
WebAssembly and is the environment you actually ship code in. It also reads
exercise _directories_ when they exist, so it doubles as the authoring tool:
edit an exercise, restart, see it.

Packaging installers (electron-builder, signing, notarisation) is not set up
yet.

---

## Progress, accounts and sync

There are none, deliberately.

Progress is local. Export and import are already implemented, so moving to
another machine is a file rather than a service.

If cross-device sync is wanted later, the shape is settled: `ProgressStore` is
an interface, so sync is a decorator that wraps the local store and pushes
snapshots. Two rules would hold:

- **Opt-in.** Someone trying the site must not have an account created for them.
- **No passwords.** The audience has GitHub accounts. OAuth needs no password
  storage, no reset flow and no email service, and the only field worth keeping
  is an opaque provider id.

At roughly two snapshot writes per learner per day, a few hundred learners sit
around 600 writes a day — comfortably inside Cloudflare D1's free tier, which
is SQLite and would run the schema in `packages/storage` unchanged.
