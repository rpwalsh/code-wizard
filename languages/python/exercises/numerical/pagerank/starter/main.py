# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""PageRank."""


def distribute(graph, ranks):
    """One round with no damping. Dangling pages give to everyone equally."""
    raise NotImplementedError


def damped(graph, ranks, damping):
    """One round with damping applied."""
    raise NotImplementedError


def pagerank(graph, damping=0.85, tolerance=1e-8, limit=100):
    """Iterate until nothing moves by more than tolerance, or limit rounds."""
    raise NotImplementedError


def ranking(ranks):
    """Return page names from highest rank to lowest, ties alphabetical."""
    raise NotImplementedError
