# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Graph representation drills."""


def build_directed(edges):
    """Return {node: sorted targets}. Every mentioned node gets a key."""
    raise NotImplementedError


def build_undirected(edges):
    """Return {node: sorted neighbors}, each edge going both ways."""
    raise NotImplementedError


def neighbors_of(graph, node):
    """Return the neighbor list, or [] for an unknown node."""
    raise NotImplementedError


def to_matrix(graph, order):
    """Return rows of 0/1 for edges from order[i] to order[j]."""
    raise NotImplementedError
