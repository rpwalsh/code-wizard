/**
 * Test registration.
 *
 * A test file imports `test`, calls it, and the harness runs what was
 * registered. That indirection buys the two things the platform needs and a
 * bare `assert` cannot give: a stable identifier per case, and a `concept`
 * marker saying which skill the case probes, which is what turns a failure
 * into "you are missing safe dictionary lookup" rather than "line 14".
 *
 * Registration is module-level state, which is exactly what you would avoid
 * in application code. Here the process runs once and exits, and the
 * alternative — passing a registry through every import — would put plumbing
 * in front of a learner reading their own test file.
 */
const registered = [];

/**
 * Register one test.
 *
 * `options.concept` names the skill this case probes. Everything else about a
 * case — its file, its line — the harness works out for itself.
 */
export function test(name, body, options = {}) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('A test needs a name.');
  }
  if (typeof body !== 'function') {
    throw new TypeError(`Test "${name}" needs a function.`);
  }
  registered.push({
    name,
    body,
    concept: options.concept ?? null,
    // Captured at registration so the harness can report where a case lives
    // without parsing anything.
    site: new Error().stack ?? '',
  });
}

/** Everything registered so far. Used by the harness, not by test files. */
export function collected() {
  return registered;
}

/** Forget everything. The harness calls this between files. */
export function reset() {
  registered.length = 0;
}
