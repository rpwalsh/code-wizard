# Principles

Constraints, not aspirations. Each one below is either enforced by a test or
falsifiable by reading the code, because a principle nobody can check is a
marketing sentence.

---

## 1. No AI in the learner experience

Not "minimal AI". Not "AI only for the open-ended parts". **None.**

The product exists because powerful assistants removed some of the
code-production machinery from people's heads. A tool for rebuilding that
capability cannot contain the thing that eroded it — and the tempting place to
put it is always the hard part, which is exactly the muscle being rebuilt.

There is also a practical argument. The moment an LLM is in the loop:

- The claim becomes unfalsifiable. A learner can never know which of their
  judgments were actually theirs.
- Marginal cost per learner stops being zero, which forces accounts, keys,
  rate limits and eventually a paywall.
- Offline and air-gapped deployment die.
- "Why did the system score me 71.4 on 14 March?" stops having an answer.

**Enforced by** `tests/principles.test.ts` — no LLM client may appear anywhere
in the dependency tree — and by a browser test asserting the running app makes
no network request other than the pinned Python runtime.

When a learner is stuck, the answer is a better instrument, never a better
sentence. That is what the execution tracer is for.

---

## 2. Instruments, not answers

When someone cannot say why their code produced 41 instead of 42, the useful
response is not an explanation. It is the ability to watch the value change.

This is why a failing test offers **Watch it run** rather than a longer
paragraph, and why the trace shows how many times each line actually executed.
A loop body that ran three times when the learner expected four is the whole
lesson, and stating it in prose would rob them of finding it.

Hints exist, and they are ordered from least to most explicit, and taking one
is recorded. That is a deliberate cost, quietly stated — not a punishment.

---

## 3. Free forever, as an architectural constraint

No ads, no tiers, no certificates, no sponsored content, no recruiter access
to learner data, no engagement mechanics designed to maximise sessions, and no
"free until we have enough users".

This is a design constraint rather than a pricing decision, and it shows up in
the architecture: the web build is static files, Python runs in the visitor's
own browser, and progress lives in their own storage. Marginal cost per
additional learner is approximately zero, so there is never a quarter where
charging becomes the obvious next step.

---

## 4. The platform does not need to know who you are to teach you

No account. No sign-in. No identity.

Progress is local — IndexedDB in the browser, SQLite on the desktop — and
export and import already work, so moving between machines is a file rather
than a service.

If synchronisation is ever added it must be opt-in, must not store passwords,
and must not be required for anything. See [docs/deploying.md](docs/deploying.md).

---

## 5. Measurement is against yourself, never against other people

No leaderboards. No percentiles. No "better than 83% of learners".

Ranking changes the goal from _recover capability_ to _optimise a score_, and
those come apart immediately. The comparison that matters is the learner
against their own dependence on assistance.

---

## 6. Knowledge and fluency are different numbers

An experienced engineer can score high on conceptual knowledge and low on
recall, and the two are not in tension — that gap _is_ the product's subject
matter. So mastery is a vector, never a single percentage, and a declared
prior at onboarding seeds knowledge and recognition while leaving recall,
speed and independence at zero to be earned.

---

## 7. Evidence is durable; the model over it is replaceable

Attempts are an append-only event log. Mastery is a projection over that log,
recomputed rather than stored, so improving the scoring model re-derives
history instead of invalidating it.

Attempts also record the exercise version they were made against, so editing
content cannot silently rewrite someone's past.

---

## 8. Success is the learner not needing this any more

The goal is the progression from _I need the debugger_ to _I just write the
thing_. Nothing in the product should be designed to prolong that.

Because nothing is being sold, there is no incentive pulling the other way —
which is the main reason this principle is credible rather than merely stated.

---

## 9. The language is a plugin

The learning engine does not know Python exists. There are two runtimes behind
one contract already — a native interpreter and CPython compiled to
WebAssembly — and a cross-runtime test requires them to agree on the whole
curriculum, because a learner on the website and one on the desktop have to be
measured by the same ruler.

---

## 10. Content is data, and open

Exercises, skills, prerequisites and tests are declarative files, not code.
Anyone can read them, fork them, mirror them, translate them, or run the whole
thing on an air-gapped machine.

The goal is not to capture users. It is to make the capability ordinary.
