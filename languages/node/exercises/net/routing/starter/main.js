// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A small router: paths with parameters, and honest status codes.
 */

/**
 * @param {Array<{method: string, pattern: string, name: string}>} routes
 */
export function createRouter(routes) {
  return {
    route(method, path) {
      throw new Error('not implemented');
    },
  };
}
