"""Truth drills."""


def in_range(value, low, high):
    """Return True when value is between low and high, inclusive."""
    return low <= value <= high


def first_truthy(a, b):
    """Return a when it is truthy, otherwise b."""
    return a or b


def both_present(a, b):
    """Return True only when both are truthy. Must be a bool."""
    return bool(a and b)


def is_blank(text):
    """Return True when text is empty or only whitespace."""
    return not text.strip()
