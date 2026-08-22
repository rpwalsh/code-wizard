"""Floating point and vector drills."""


def close_enough(a, b, tolerance):
    """Return True when a and b are within tolerance of each other."""
    raise NotImplementedError


def normalise(weights):
    """Scale the values so they sum to 1. A zero total spreads evenly."""
    raise NotImplementedError


def total_error(actual, expected):
    """Return the sum of absolute differences across the shared keys."""
    raise NotImplementedError


def settled(before, after, tolerance):
    """Return True when no key moved by more than tolerance."""
    raise NotImplementedError
