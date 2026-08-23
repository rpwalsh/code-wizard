# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Floating point and vector drills."""


def close_enough(a, b, tolerance):
    """Return True when a and b are within tolerance of each other."""
    return abs(a - b) <= tolerance


def normalize(weights):
    """Scale the values so they sum to 1. A zero total spreads evenly."""
    if not weights:
        return {}
    total = sum(weights.values())
    if total == 0:
        share = 1 / len(weights)
        return {key: share for key in weights}
    return {key: value / total for key, value in weights.items()}


def total_error(actual, expected):
    """Return the sum of absolute differences across the shared keys."""
    return sum(abs(actual[key] - expected[key]) for key in expected)


def settled(before, after, tolerance):
    """Return True when no key moved by more than tolerance."""
    for key in before:
        if not close_enough(before[key], after[key], tolerance):
            return False
    return True
