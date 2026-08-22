"""Recursion drills. No loops."""


def countdown(n):
    """Return [n, n-1, ..., 1]. countdown(0) is []."""
    if n <= 0:
        return []
    return [n] + countdown(n - 1)


def total(values):
    """Return the sum. The sum of nothing is 0."""
    if not values:
        return 0
    return values[0] + total(values[1:])


def reverse(text):
    """Return the string backwards, one character at a time."""
    if not text:
        return ""
    return reverse(text[1:]) + text[0]


def position(values, target, index=0):
    """Return the index of the first target, or -1."""
    if not values:
        return -1
    if values[0] == target:
        return index
    return position(values[1:], target, index + 1)
