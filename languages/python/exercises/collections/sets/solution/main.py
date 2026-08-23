# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Set drills."""


def unique(items):
    """Return the distinct items, in the order they first appeared."""
    seen = set()
    result = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def shared(first, second):
    """Return the values in both, as a sorted list."""
    return sorted(set(first) & set(second))


def only_in_first(first, second):
    """Return the values in the first and not the second, as a sorted list."""
    return sorted(set(first) - set(second))


def has_duplicates(items):
    """Return True when any item appears more than once."""
    return len(set(items)) != len(items)
