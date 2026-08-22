"""Nested data drills."""


def city_of(record):
    """Return record["address"]["city"], or None if either is missing."""
    raise NotImplementedError


def all_tags(posts):
    """Return every tag across the posts as one flat sorted list, no duplicates."""
    raise NotImplementedError


def group_by_city(people):
    """Return {city: [name, ...]}, keeping order within each city."""
    raise NotImplementedError


def deep_copy_grid(grid):
    """Return a copy of a list of lists that shares no row with the original."""
    raise NotImplementedError
