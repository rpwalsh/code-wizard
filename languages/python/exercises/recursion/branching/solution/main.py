# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Branching recursion drills."""


def flatten(nested):
    """Return one flat list of the values, in order."""
    result = []
    for item in nested:
        if isinstance(item, list):
            result = result + flatten(item)
        else:
            result = result + [item]
    return result


def deepest(nested):
    """Return how many levels there are. deepest([]) is 1."""
    depths = [deepest(item) for item in nested if isinstance(item, list)]
    if not depths:
        return 1
    return 1 + max(depths)


def count_values(nested):
    """Return how many non-list values there are."""
    total = 0
    for item in nested:
        if isinstance(item, list):
            total = total + count_values(item)
        else:
            total = total + 1
    return total


def running_totals(values, so_far=0):
    """Return the cumulative sums. [1, 2, 3] gives [1, 3, 6]."""
    if not values:
        return []
    carried = so_far + values[0]
    return [carried] + running_totals(values[1:], carried)
