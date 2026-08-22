"""Arithmetic drills."""


def halves(total):
    """Return total divided by two, keeping the fraction."""
    return total / 2


def whole_halves(total):
    """Return how many whole halves fit into total, as an int."""
    return total // 2


def remainder(total, size):
    """Return what is left after packing total into groups of size."""
    return total % size


def is_even(number):
    """Return True if number is even."""
    return number % 2 == 0
