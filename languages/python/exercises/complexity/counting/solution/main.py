# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Counting the work, rather than estimating it."""


def scan_count(values, target):
    """Return the number of comparisons made while searching for target."""
    comparisons = 0
    for value in values:
        comparisons = comparisons + 1
        if value == target:
            return comparisons
    return comparisons


def pair_count(values):
    """Return the number of distinct pairs of positions compared."""
    comparisons = 0
    for first in range(len(values)):
        for second in range(first + 1, len(values)):
            comparisons = comparisons + 1
    return comparisons


def duplicate_count_slow(values):
    """Return comparisons made when checking membership against a list."""
    comparisons = 0
    seen = []
    for value in values:
        comparisons = comparisons + len(seen)
        if value not in seen:
            seen.append(value)
    return comparisons


def duplicate_count_fast(values):
    """Return comparisons made when checking membership against a set."""
    comparisons = 0
    seen = set()
    for value in values:
        comparisons = comparisons + 1
        seen.add(value)
    return comparisons
