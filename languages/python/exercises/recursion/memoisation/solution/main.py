"""Memoisation drills."""


def fib_naive(n):
    """Return the nth Fibonacci number, recursively, with no cache."""
    if n < 2:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)


def fib_calls(n):
    """Return how many calls fib_naive(n) makes in total."""
    if n < 2:
        return 1
    return 1 + fib_calls(n - 1) + fib_calls(n - 2)


def _fib(n, cache):
    if n in cache:
        return cache[n]
    if n < 2:
        result = n
    else:
        result = _fib(n - 1, cache) + _fib(n - 2, cache)
    cache[n] = result
    return result


def fib_fast(n):
    """Return the nth Fibonacci number, using a cache you write."""
    return _fib(n, {})


def _counted(n, cache, tally):
    tally[0] = tally[0] + 1
    if n in cache:
        return cache[n]
    if n < 2:
        result = n
    else:
        result = _counted(n - 1, cache, tally) + _counted(n - 2, cache, tally)
    cache[n] = result
    return result


def cached_calls(n):
    """Return how many calls the cached version makes."""
    tally = [0]
    _counted(n, {}, tally)
    return tally[0]
