# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Names and objects."""


def swap(pair):
    """Return a new two-element list, reversed. Do not change the argument."""
    raise NotImplementedError


def rebind(values):
    """Point a local name at a new list and return it. Caller is unaffected."""
    raise NotImplementedError


def mutate(values):
    """Append "x" to the caller's own list and return it."""
    raise NotImplementedError


def same_object(a, b):
    """Return True when a and b are the same object, not merely equal."""
    raise NotImplementedError
