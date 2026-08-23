// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A timer, a detachable ticker, and a look at where properties really live.
 */

export class Timer {
  constructor(start = 0) {
    this.start = start;
    this.count = start;
  }

  tick() {
    this.count += 1;
    return this.count;
  }

  get elapsed() {
    return this.count;
  }

  reset() {
    this.count = this.start;
  }

  makeTicker() {
    // An arrow has no this of its own, so it keeps the one from this call —
    // where this is the timer. A plain function here would lose it.
    return () => this.tick();
  }
}

export function ownedBy(instance) {
  return Object.getOwnPropertyNames(instance).sort();
}

export function methodsOf(instance) {
  const prototype = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(prototype)
    .filter((name) => {
      if (name === 'constructor') return false;
      // The descriptor inspects without invoking; reading prototype[name]
      // would call a getter on the wrong receiver.
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      return typeof descriptor.value === 'function';
    })
    .sort();
}
