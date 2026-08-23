<!-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) -->

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

The same idea runs the other way in the prediction panel. Before running, the
learner can say what the machine will do. Nothing forces it and nothing nags,
but committing to an answer first turns pressing Run from a lookup into a test
of their own model — and a wrong prediction is colored as information, never
as a failure, because being wrong there is the measurement working.

---

## 3. Free forever, as an architectural constraint

No ads, no tiers, no certificates, no sponsored content, no recruiter access
to learner data, no engagement mechanics designed to maximize sessions, and no
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

Sign-in was considered and declined — not deferred pending demand, declined.
An account is not a login screen; it is a database of people, and everything
that comes with holding one. Storing nothing is the only version of that job
that stays done when nobody is paying attention.

See [docs/data.md](docs/data.md) for what is stored and the tests that keep it
there, and [docs/deploying.md](docs/deploying.md) for the shape sync would take
if that decision were ever revisited.

Three tests enforce this rather than trusting it: no external address may
appear in the browser source, no analytics or payment dependency may appear in
a manifest, and a real browser run must make no request off its own origin.

---

## 5. Measurement is against yourself, never against other people

No leaderboards. No percentiles. No "better than 83% of learners".

Ranking changes the goal from _recover capability_ to _optimize a score_, and
those come apart immediately. The comparison that matters is the learner
against their own dependence on assistance.

That comparison is built, not gestured at. A personal baseline is derived from
the learner's first attempts and held up beside their most recent ones, and the
assistance-dependency chart shows how often they still reached for a hint, the
documentation or the answer. Both are drawn falling-is-good and labeled that
way. Neither has anyone else in it.

---

## 6. Knowledge and fluency are different numbers

An experienced engineer can score high on conceptual knowledge and low on
recall, and the two are not in tension — that gap _is_ the product's subject
matter. So mastery is a vector of ten dimensions, never a single percentage.

A declared prior at onboarding may only touch the three in
`claimableDimensions`: knowledge, recognition and application. Recall,
composition, debugging, transfer, speed, retention and independence start at
zero however senior the learner is, because they are the subject matter, and
a test asserts it.

Even knowledge is only _seeded_ by a claim. The one place it is ever earned is
a prediction made before running — which is also the only way a claim can be
corrected downward by reality.

---

## 6a. Assistance is withdrawn, never restored

The training modes are a ladder, and it only ever goes one way:

| Rung           | Withdraws                                  |
| -------------- | ------------------------------------------ |
| **Learn**      | nothing                                    |
| **Practice**   | the solution                               |
| **Fluency**    | hints, documentation, autocomplete         |
| **Blank page** | the starter code — an empty file and tests |
| **Simulation** | the tests; you decide when it is right     |

A test asserts that no rung offers anything the rung below it does not. If one
ever did, "further up" would stop meaning "less help", and the dependency
measurement underneath it would stop meaning anything.

This is also why full recall requires an empty file. A skeleton answers half
the question before it is asked — which shape, which signature, which imports
— so completing one is capped below the top of that dimension.

---

## 6b. An experienced programmer is not treated as a beginner

Sending someone through a beginner's ladder for material they already know is
how you lose them, and they would be right to go. But simply believing "I know
this" stops the system measuring anything, and every figure it printed
afterwards would be worth nothing.

So the claim is neither refused nor trusted. It is put to one short test: the
hardest exercise for that skill that they have not seen, on the blank page,
with nothing to lean on. Pass it unaided and inside a generous budget and the
skill is credited along with everything beneath it — the ladder under something
you have just demonstrated is not worth anyone's evening. Fail and nothing is
lost but the shortcut, because a failed demonstration is not a failed exercise.
It is an answer to a question the learner asked about themselves.

The prerequisites credited this way raise _readiness_ and not the headline, and
their observation count stays at zero. They stop gating the learner without
anybody pretending they were measured.

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

## 10. Content is data, and readable

Exercises, skills, prerequisites, hints and tests are declarative files, not
code. Anyone can read exactly how they are being taught and exactly how they
are being measured, and run the whole thing on an air-gapped machine.

Readable is not the same as open, and this is the one place the two come
apart deliberately. The software is licensed permissively for noncommercial
use ([LICENSE.md](LICENSE.md)); the curriculum is not
([CONTENT-LICENSE.md](CONTENT-LICENSE.md)). The exercises, the skill graph and
the mastery model are one calibrated instrument, and a fork that changes the
exercises while keeping the scoring produces numbers that look comparable and
are not.

What a learner can do is unchanged and unconditional: read all of it, run all
of it, offline, for free, forever, without asking anyone. What needs
permission is selling it or reshaping it — and neither of those is learning.

The goal is not to capture users. It is to make the capability ordinary while
keeping the measurement worth something.
