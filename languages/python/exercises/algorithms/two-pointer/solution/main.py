# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Two pointers and sliding windows."""


def pair_summing(values, target):
    """Return (low, high) indices of a pair summing to target, or None."""
    low = 0
    high = len(values) - 1
    while low < high:
        total = values[low] + values[high]
        if total == target:
            return low, high
        if total < target:
            low = low + 1
        else:
            high = high - 1
    return None


def remove_duplicates(values):
    """Rewrite values in place so distinct values come first. Return the count."""
    if not values:
        return 0
    write = 1
    for read in range(1, len(values)):
        if values[read] != values[write - 1]:
            values[write] = values[read]
            write = write + 1
    return write


def longest_unique(text):
    """Return the length of the longest stretch with no repeated character."""
    seen = set()
    start = 0
    longest = 0
    for end in range(len(text)):
        while text[end] in seen:
            seen.remove(text[start])
            start = start + 1
        seen.add(text[end])
        if end - start + 1 > longest:
            longest = end - start + 1
    return longest


def max_window_sum(values, width):
    """Return the largest sum of any width consecutive values."""
    if width <= 0 or width > len(values):
        return 0
    total = sum(values[:width])
    best = total
    for end in range(width, len(values)):
        total = total + values[end] - values[end - width]
        if total > best:
            best = total
    return best
