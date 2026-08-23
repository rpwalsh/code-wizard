# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Tables and intervals."""


def ways_up(steps):
    """Count the ways to climb steps taking one or two at a time."""
    if steps < 0:
        return 0
    previous = 1
    current = 1
    for _ in range(steps):
        previous, current = current, previous + current
    return previous


def best_take(values):
    """Largest total with no two adjacent entries taken."""
    skipped = 0
    taken = 0
    for value in values:
        skipped, taken = max(skipped, taken), skipped + value
    return max(skipped, taken)


def fewest_coins(coins, amount):
    """Fewest coins summing to amount, or -1."""
    if amount < 0:
        return -1
    best = [None] * (amount + 1)
    best[0] = 0
    for total in range(1, amount + 1):
        for coin in coins:
            if coin > total or best[total - coin] is None:
                continue
            candidate = best[total - coin] + 1
            if best[total] is None or candidate < best[total]:
                best[total] = candidate
    if best[amount] is None:
        return -1
    return best[amount]


def merge_ranges(ranges):
    """Merge overlapping or touching (start, end) pairs, sorted by start."""
    if not ranges:
        return []
    merged = []
    for start, end in sorted(ranges):
        if merged and start <= merged[-1][1]:
            last_start, last_end = merged[-1]
            if end > last_end:
                merged[-1] = (last_start, end)
        else:
            merged.append((start, end))
    return merged
