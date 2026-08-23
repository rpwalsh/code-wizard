# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Ordering, cycles and cheapest routes."""


def count_regions(grid):
    """Count connected groups of "#" cells, four-directionally."""
    raise NotImplementedError


def has_cycle(graph):
    """Return True when the directed graph contains a cycle."""
    raise NotImplementedError


def ordering(graph):
    """Return a dependency-respecting order, ties alphabetical, or None."""
    raise NotImplementedError


def cheapest(graph, start, goal):
    """Return the cost of the cheapest route in a weighted graph, or None."""
    raise NotImplementedError
