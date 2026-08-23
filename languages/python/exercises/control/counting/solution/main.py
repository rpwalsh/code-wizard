# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Counting drills."""


def countdown(start):
    """Return a list from start down to 1."""
    return list(range(start, 0, -1))


def every_other(items):
    """Return the items at positions 0, 2, 4 and so on."""
    return items[::2]


def numbered(items):
    """Return "1. apple" style strings, numbered from one."""
    return [f"{position}. {item}" for position, item in enumerate(items, start=1)]


def pair_up(names, scores):
    """Return a list of (name, score) tuples, stopping at the shorter."""
    return list(zip(names, scores))
