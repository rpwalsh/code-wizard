// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A Map with opinions: tokens in, construction policy out.
 */

export type Token = string;
export type Provided = string | number | boolean | string[] | Record<string, string>;

type Provider =
  | { kind: 'value'; value: Provided }
  | { kind: 'factory'; factory: () => Provided; created: boolean; instance?: Provided }
  | { kind: 'multi'; values: Provided[] };

export class Injector {
  #providers = new Map<Token, Provider>();

  provideValue(token: Token, value: Provided): void {
    this.#refuseMultiMix(token);
    this.#providers.set(token, { kind: 'value', value });
  }

  provideFactory(token: Token, factory: () => Provided): void {
    this.#refuseMultiMix(token);
    this.#providers.set(token, { kind: 'factory', factory, created: false });
  }

  provideMulti(token: Token, value: Provided): void {
    const existing = this.#providers.get(token);
    if (existing !== undefined && existing.kind !== 'multi') {
      // The confusion should not wait for resolve time.
      throw new Error(`token ${token} is already a non-multi provider`);
    }
    if (existing === undefined) {
      this.#providers.set(token, { kind: 'multi', values: [value] });
    } else {
      existing.values.push(value);
    }
  }

  resolve(token: Token): Provided | Provided[] {
    const provider = this.#providers.get(token);
    if (provider === undefined) {
      // A silent undefined from an injector is a bug with a delay fuse.
      throw new Error(`no provider for ${token}`);
    }

    switch (provider.kind) {
      case 'value':
        return provider.value;
      case 'factory':
        if (!provider.created) {
          // First resolve, not registration — laziness is why an unused
          // service costs nothing. `created` exists because a factory may
          // legitimately return a falsy value.
          provider.instance = provider.factory();
          provider.created = true;
        }
        return provider.instance as Provided;
      case 'multi':
        // A copy, so no caller can mutate the registry through the result.
        return [...provider.values];
    }
  }

  has(token: Token): boolean {
    return this.#providers.has(token);
  }

  #refuseMultiMix(token: Token): void {
    if (this.#providers.get(token)?.kind === 'multi') {
      throw new Error(`token ${token} is already a multi provider`);
    }
  }
}
