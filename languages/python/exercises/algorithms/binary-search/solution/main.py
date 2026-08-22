"""Binary search."""


def find(values, target):
    """Return the index of target in a sorted list, or -1."""
    low = 0
    high = len(values) - 1
    while low <= high:
        middle = (low + high) // 2
        if values[middle] == target:
            return middle
        if values[middle] < target:
            low = middle + 1
        else:
            high = middle - 1
    return -1


def first_at_least(values, target):
    """Return the index of the first value >= target, or len(values)."""
    low = 0
    high = len(values)
    while low < high:
        middle = (low + high) // 2
        if values[middle] < target:
            low = middle + 1
        else:
            # The middle might be the answer, so it is not discarded.
            high = middle
    return low


def search_rotated(values, target):
    """Search a rotated sorted list with no duplicates. Return index or -1."""
    low = 0
    high = len(values) - 1
    while low <= high:
        middle = (low + high) // 2
        if values[middle] == target:
            return middle
        if values[low] <= values[middle]:
            if values[low] <= target < values[middle]:
                high = middle - 1
            else:
                low = middle + 1
        else:
            if values[middle] < target <= values[high]:
                low = middle + 1
            else:
                high = middle - 1
    return -1


def _days_needed(weights, capacity):
    days = 1
    carried = 0
    for weight in weights:
        if carried + weight > capacity:
            days = days + 1
            carried = 0
        carried = carried + weight
    return days


def smallest_capacity(weights, days):
    """Smallest daily capacity that ships weights in order within days days."""
    if not weights:
        return 0
    low = max(weights)
    high = sum(weights)
    while low < high:
        middle = (low + high) // 2
        if _days_needed(weights, middle) <= days:
            high = middle
        else:
            low = middle + 1
    return low
