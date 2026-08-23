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
  throw new Error('not implemented');
}

export function withHeader(request: HttpRequest, name: string, value: string): HttpRequest {
  throw new Error('not implemented');
}

export class Client {
  readonly backend: Backend;
  readonly interceptors: readonly Interceptor[];

  constructor(backend: Backend, interceptors: readonly Interceptor[]) {
    this.backend = backend;
    this.interceptors = interceptors;
  }

  get(url: string): Response {
    throw new Error('not implemented');
  }
}

export function authInterceptor(token: string): Interceptor {
  throw new Error('not implemented');
}

export const retryInterceptor: Interceptor = () => {
  throw new Error('not implemented');
};
