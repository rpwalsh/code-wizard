// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Requests from parts, and the interceptor chain they flow through.
 */

export interface HttpRequest {
  readonly url: string;
  readonly method: 'GET';
  readonly headers: Readonly<Record<string, string>>;
}

export interface Response {
  readonly status: number;
  readonly body: string;
}

export type Backend = (request: HttpRequest) => Response;
export type Interceptor = (request: HttpRequest, next: Backend) => Response;

export function buildUrl(
  base: string,
  path: string,
  params: Readonly<Record<string, string>>,
): string {
  // Exactly one slash at the joint, whichever side brought one.
  const joined = `${base.replace(/\/+$/u, '')}/${path.replace(/^\/+/u, '')}`;

  const entries = Object.entries(params);
  if (entries.length === 0) return joined;

  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${joined}?${query}`;
}

export function withHeader(request: HttpRequest, name: string, value: string): HttpRequest {
  // Two spreads: the headers object must be copied too, or the "new"
  // request shares mutable state with the old one.
  return {
    ...request,
    headers: { ...request.headers, [name.toLowerCase()]: value },
  };
}

export class Client {
  readonly backend: Backend;
  readonly interceptors: readonly Interceptor[];

  constructor(backend: Backend, interceptors: readonly Interceptor[]) {
    this.backend = backend;
    this.interceptors = interceptors;
  }

  get(url: string): Response {
    // Built from the backend outward, so interceptor 0 is outermost: it
    // sees the request first and the response last.
    const chain = this.interceptors.reduceRight<Backend>(
      (next, interceptor) => (request) => interceptor(request, next),
      this.backend,
    );
    return chain({ url, method: 'GET', headers: {} });
  }
}

export function authInterceptor(token: string): Interceptor {
  return (request, next) => next(withHeader(request, 'Authorization', `Bearer ${token}`));
}

export const retryInterceptor: Interceptor = (request, next) => {
  const first = next(request);
  if (first.status !== 503) return first;
  // One more try, and the second answer is the answer.
  return next(request);
};
