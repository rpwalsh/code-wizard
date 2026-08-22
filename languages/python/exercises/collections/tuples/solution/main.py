"""Tuple drills."""


def minmax(values):
    """Return (smallest, largest)."""
    return min(values), max(values)


def split_first(values):
    """Return (first, rest). Empty gives (None, [])."""
    if not values:
        return None, []
    first, *rest = values
    return first, rest


def totals(pairs):
    """Return the sum of the amounts in a list of (name, amount) tuples."""
    total = 0
    for _name, amount in pairs:
        total = total + amount
    return total


def rotate(triple):
    """Return the three-element tuple rotated left by one."""
    a, b, c = triple
    return b, c, a
