# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Slice drills."""


def first_three(items):
    """Return the first three elements."""
    return items[:3]


def last_two(items):
    """Return the last two elements."""
    return items[-2:]


def middle(items):
    """Return everything except the first and last element."""
    return items[1:-1]


def backwards(items):
    """Return the whole list, reversed."""
    return items[::-1]
