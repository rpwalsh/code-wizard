// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A small router: paths with parameters, and honest status codes.
 */

/** Segments, with leading and trailing slashes treated as absent. */
function segments(path) {
  return path.split('/').filter((part) => part !== '');
}

/**
 * The captured parameters, or null when this pattern does not describe
 * this path. An empty object is a real match, which is why the failure
 * value is null rather than something falsy of the same shape.
 */
function capture(patternSegments, pathSegments) {
  if (patternSegments.length !== pathSegments.length) return null;

  const params = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    const actual = pathSegments[index];

    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

function parameterCount(patternSegments) {
  return patternSegments.filter((part) => part.startsWith(':')).length;
}

export function createRouter(routes) {
  const compiled = routes.map((route) => ({
    ...route,
    segments: segments(route.pattern),
  }));

  return {
    route(method, path) {
      const pathSegments = segments(path);

      // Every route whose *path* matches, regardless of method. This list is
      // what makes an honest 405 possible.
      const matches = [];
      for (const route of compiled) {
        const params = capture(route.segments, pathSegments);
        if (params !== null) matches.push({ route, params });
      }

      if (matches.length === 0) return { status: 404 };

      const allowed = matches.filter((match) => match.route.method === method);
      if (allowed.length === 0) {
        const allow = [...new Set(matches.map((match) => match.route.method))].sort();
        return { status: 405, allow };
      }

      // Fewest parameters wins, so /users/me beats /users/:id whatever the
      // registration order was.
      allowed.sort(
        (left, right) =>
          parameterCount(left.route.segments) - parameterCount(right.route.segments),
      );

      const best = allowed[0];
      return { status: 200, name: best.route.name, params: best.params };
    },
  };
}
