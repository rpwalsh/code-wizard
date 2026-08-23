# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Heap drills."""

import heapq


def k_largest(values, k):
    """Return the k largest values, largest first."""
    if k <= 0:
        return []
    keep = []
    for value in values:
        if len(keep) < k:
            heapq.heappush(keep, value)
        elif value > keep[0]:
            heapq.heappushpop(keep, value)
    return sorted(keep, reverse=True)


def k_smallest(values, k):
    """Return the k smallest values, smallest first."""
    if k <= 0:
        return []
    # A minimum heap has no maximum version, so push the negative.
    keep = []
    for value in values:
        if len(keep) < k:
            heapq.heappush(keep, -value)
        elif -value > keep[0]:
            heapq.heappushpop(keep, -value)
    return sorted(-value for value in keep)


def merge_sorted_lists(lists):
    """Merge any number of sorted lists into one sorted list."""
    frontier = []
    for index, values in enumerate(lists):
        if values:
            heapq.heappush(frontier, (values[0], index, 0))

    merged = []
    while frontier:
        value, index, position = heapq.heappop(frontier)
        merged.append(value)
        following = position + 1
        if following < len(lists[index]):
            heapq.heappush(frontier, (lists[index][following], index, following))
    return merged


def most_common(counts, k):
    """Return the k names with the highest counts, ties alphabetical."""
    if k <= 0:
        return []
    ordered = sorted(counts, key=lambda name: (-counts[name], name))
    return ordered[:k]
