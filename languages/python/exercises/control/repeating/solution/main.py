"""Repetition drills."""


def halve_until_small(number):
    """Halve number until it is below 1. Return how many halvings that took."""
    steps = 0
    while number >= 1:
        number = number // 2
        steps = steps + 1
    return steps


def first_negative(values):
    """Return the first negative value, or None."""
    for value in values:
        if value < 0:
            return value
    return None


def sum_ignoring_negatives(values):
    """Return the total, skipping negative values."""
    total = 0
    for value in values:
        if value < 0:
            continue
        total = total + value
    return total


def all_below(values, limit):
    """Return True when every value is below limit."""
    for value in values:
        if value >= limit:
            return False
    return True
