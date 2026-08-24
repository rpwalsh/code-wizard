# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Decorators that do not lie about the function they wrapped."""

from __future__ import annotations

import functools
from typing import Any, Callable


def counted(func: Callable[..., Any]) -> Callable[..., Any]:
    # functools.wraps copies __name__, __doc__ and __wrapped__ across.
    # Without it every decorated function is called "wrapper" in tracebacks,
    # in help(), and in any log line that reports which function ran.
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        wrapper.calls += 1
        return func(*args, **kwargs)

    wrapper.calls = 0
    return wrapper


def memoized(func: Callable[..., Any]) -> Callable[..., Any]:
    cache: dict[tuple[Any, ...], Any] = {}

    @functools.wraps(func)
    def wrapper(*args: Any) -> Any:
        # A sentinel rather than `if key in cache` twice, and rather than
        # `cache.get(key)`: a cached None or 0 is a real result and must not
        # be recomputed every call.
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    wrapper.cache = cache
    return wrapper


def retried(attempts: int) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last: Exception | None = None
            for _ in range(max(1, attempts)):
                try:
                    return func(*args, **kwargs)
                except Exception as error:  # noqa: BLE001 - re-raised below
                    last = error
            # Re-raised rather than wrapped: the caller wanted this function's
            # error, not a report that retrying failed.
            raise last  # type: ignore[misc]

        return wrapper

    return decorator


def defaulted(value: Any) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except Exception:  # noqa: BLE001 - the point is to swallow it
                return value

        return wrapper

    return decorator
