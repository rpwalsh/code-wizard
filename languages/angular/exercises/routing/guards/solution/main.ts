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

function segments(path: string): string[] {
  return path.split('/').filter((part) => part !== '');
}

export function matchRoute(
  routes: readonly Route[],
  path: string,
): { name: string; params: Record<string, string> } | null {
  const pathParts = segments(path);

  // Config order, first match wins — which is why /users/new must be
  // listed before /users/:id, and why this loop returns eagerly.
  for (const route of routes) {
    const patternParts = segments(route.path);
    if (patternParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let matched = true;
    for (let index = 0; index < patternParts.length; index += 1) {
      const pattern = patternParts[index];
      if (pattern.startsWith(':')) {
        params[pattern.slice(1)] = decodeURIComponent(pathParts[index]);
      } else if (pattern !== pathParts[index]) {
        matched = false;
        break;
      }
    }

    if (matched) return { name: route.name, params };
  }
  return null;
}

export function runGuards(guards: readonly GuardFn[], context: GuardContext): GuardResult {
  for (const guard of guards) {
    const result = guard(context);
    // The first refusal is the answer; later guards assume this one passed.
    if (result !== true) return result;
  }
  return true;
}

export function navigate(routes: readonly Route[], path: string, session: Session): Navigation {
  const match = matchRoute(routes, path);
  if (match === null) return { status: 'not-found' };

  const verdict = runGuards(match ? (routes.find((r) => r.name === match.name)?.guards ?? []) : [], {
    params: match.params,
    session,
  });

  if (verdict === true) {
    return { status: 'activated', name: match.name, params: match.params };
  }
  if (verdict === false) {
    return { status: 'blocked' };
  }
  // Surfaced as data: the caller navigates (and can notice loops).
  return { status: 'redirected', to: verdict.redirectTo };
}

export const requireUser: GuardFn = (context) =>
  context.session.user !== null ? true : { redirectTo: '/login' };

export function requireRole(role: string): GuardFn {
  // A known user lacking a role is blocked, not bounced to login — the
  // redirect would loop for everyone logged in and under-privileged.
  return (context) => (context.session.roles.includes(role) ? true : false);
}
