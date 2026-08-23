# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Generators, decorators and context managers."""

import functools
from contextlib import contextmanager


def evens_up_to(limit):
    """Yield the even numbers below limit."""
    value = 0
    while value < limit:
        yield value
        value = value + 2


def counting_from(start):
    """Yield start, start + 1, and never stop."""
    value = start
    while True:
        yield value
        value = value + 1


def first(iterable, count):
    """Return the first count values as a list. Must work on infinite input."""
    taken = []
    if count <= 0:
        return taken
    for value in iterable:
        taken.append(value)
        if len(taken) == count:
            break
    return taken


def counted(function):
    """Decorator: count calls on wrapper.calls, keep the original __name__."""

    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        wrapper.calls = wrapper.calls + 1
        return function(*args, **kwargs)

    wrapper.calls = 0
    return wrapper


@contextmanager
def collecting():
    """Yield a list; record "entered" and always append "cleaned"."""
    record = ["entered"]
    try:
        yield record
    finally:
        # After the yield without a finally, this is skipped when the body
        # raises — which is the case the context manager exists for.
        record.append("cleaned")
