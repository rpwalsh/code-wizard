// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A Map with opinions: tokens in, construction policy out.
 */

export type Token = string;
export type Provided = string | number | boolean | string[] | Record<string, string>;

export class Injector {
  provideValue(token: Token, value: Provided): void {
    throw new Error('not implemented');
  }

  provideFactory(token: Token, factory: () => Provided): void {
    throw new Error('not implemented');
  }

  provideMulti(token: Token, value: Provided): void {
    throw new Error('not implemented');
  }

  resolve(token: Token): Provided | Provided[] {
    throw new Error('not implemented');
  }

  has(token: Token): boolean {
    throw new Error('not implemented');
  }
}
