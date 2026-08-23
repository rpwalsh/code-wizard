# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Sorting, by hand. No sorted() and no .sort()."""


def scan(values, target):
    """Return every index where target appears, in order."""
    found = []
    for index in range(len(values)):
        if values[index] == target:
            found.append(index)
    return found


def insertion_sort(values):
    """Return a new sorted list, inserting each value into place."""
    placed = []
    for value in values:
        position = len(placed)
        while position > 0 and placed[position - 1] > value:
            position = position - 1
        placed.insert(position, value)
    return placed


def merge(left, right):
    """Merge two sorted lists into one. Stable: left wins ties."""
    merged = []
    first = 0
    second = 0
    while first < len(left) and second < len(right):
        if left[first] <= right[second]:
            merged.append(left[first])
            first = first + 1
        else:
            merged.append(right[second])
            second = second + 1
    merged.extend(left[first:])
    merged.extend(right[second:])
    return merged


def merge_sort(values):
    """Return a new sorted list by splitting and merging."""
    if len(values) <= 1:
        return list(values)
    middle = len(values) // 2
    return merge(merge_sort(values[:middle]), merge_sort(values[middle:]))
