"""Nested data drills."""


def city_of(record):
    """Return record["address"]["city"], or None if either is missing."""
    return record.get("address", {}).get("city")


def all_tags(posts):
    """Return every tag across the posts as one flat sorted list, no duplicates."""
    tags = set()
    for post in posts:
        for tag in post.get("tags", []):
            tags.add(tag)
    return sorted(tags)


def group_by_city(people):
    """Return {city: [name, ...]}, keeping order within each city."""
    grouped = {}
    for person in people:
        grouped.setdefault(person["city"], []).append(person["name"])
    return grouped


def deep_copy_grid(grid):
    """Return a copy of a list of lists that shares no row with the original."""
    return [list(row) for row in grid]
