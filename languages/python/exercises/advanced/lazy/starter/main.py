"""Generators, decorators and context managers."""

import functools
from contextlib import contextmanager


def evens_up_to(limit):
    """Yield the even numbers below limit."""
    raise NotImplementedError


def counting_from(start):
    """Yield start, start + 1, and never stop."""
    raise NotImplementedError


def first(iterable, count):
    """Return the first count values as a list. Must work on infinite input."""
    raise NotImplementedError


def counted(function):
    """Decorator: count calls on wrapper.calls, keep the original __name__."""
    raise NotImplementedError


@contextmanager
def collecting():
    """Yield a list; record "entered" and always append "cleaned"."""
    raise NotImplementedError
