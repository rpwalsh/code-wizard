// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Route matching and guard chains: the decision half of navigation.
 */

export interface Session {
  readonly user: string | null;
  readonly roles: readonly string[];
}

export interface GuardContext {
  readonly params: Record<string, string>;
  readonly session: Session;
}

export type GuardResult = boolean | { readonly redirectTo: string };
export type GuardFn = (context: GuardContext) => GuardResult;

export interface Route {
  readonly path: string;
  readonly name: string;
  readonly guards?: readonly GuardFn[];
}

export type Navigation =
  | { readonly status: 'not-found' }
  | { readonly status: 'activated'; readonly name: string; readonly params: Record<string, string> }
  | { readonly status: 'blocked' }
  | { readonly status: 'redirected'; readonly to: string };

export function matchRoute(
  routes: readonly Route[],
  path: string,
): { name: string; params: Record<string, string> } | null {
  throw new Error('not implemented');
}

export function runGuards(guards: readonly GuardFn[], context: GuardContext): GuardResult {
  throw new Error('not implemented');
}

export function navigate(routes: readonly Route[], path: string, session: Session): Navigation {
  throw new Error('not implemented');
}

export const requireUser: GuardFn = () => {
  throw new Error('not implemented');
};

export function requireRole(role: string): GuardFn {
  throw new Error('not implemented');
}
