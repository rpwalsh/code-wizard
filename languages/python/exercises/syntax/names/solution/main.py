# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Names and objects."""


def swap(pair):
    """Return a new two-element list, reversed. Do not change the argument."""
    return [pair[1], pair[0]]


def rebind(values):
    """Point a local name at a new list and return it. Caller is unaffected."""
    values = ["fresh"]
    return values


def mutate(values):
    """Append "x" to the caller's own list and return it."""
    values.append("x")
    return values


def same_object(a, b):
    """Return True when a and b are the same object, not merely equal."""
    return a is b
