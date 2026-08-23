// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The bridge from error-first callbacks to async/await, and two tools
 * built on the promise side of it.
 */

export function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      // An error-first callback is a promise flattened into one function;
      // this is the unflattening.
      fn(...args, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sequence(steps, input) {
  let current = input;
  for (const step of steps) {
    // Dependent steps: each consumes the last result, so the await-in-loop
    // the linter warns about is exactly right here.
    current = await step(current);
  }
  return current;
}

export async function retry(operation, attempts, delayMs) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(delayMs);
      }
    }
  }
  // The last failure is the one that describes what finally went wrong.
  throw lastError;
}
