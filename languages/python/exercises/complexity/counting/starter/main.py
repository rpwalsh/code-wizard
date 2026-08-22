"""Counting the work, rather than estimating it."""


def scan_count(values, target):
    """Return the number of comparisons made while searching for target."""
    raise NotImplementedError


def pair_count(values):
    """Return the number of distinct pairs of positions compared."""
    raise NotImplementedError


def duplicate_count_slow(values):
    """Return comparisons made when checking membership against a list."""
    raise NotImplementedError


def duplicate_count_fast(values):
    """Return comparisons made when checking membership against a set."""
    raise NotImplementedError
