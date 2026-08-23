# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Graph representation drills."""


def build_directed(edges):
    """Return {node: sorted targets}. Every mentioned node gets a key."""
    graph = {}
    for source, target in edges:
        graph.setdefault(source, [])
        graph.setdefault(target, [])
        graph[source].append(target)
    return {node: sorted(targets) for node, targets in graph.items()}


def build_undirected(edges):
    """Return {node: sorted neighbors}, each edge going both ways."""
    graph = {}
    for source, target in edges:
        graph.setdefault(source, [])
        graph.setdefault(target, [])
        graph[source].append(target)
        graph[target].append(source)
    return {node: sorted(neighbors) for node, neighbors in graph.items()}


def neighbors_of(graph, node):
    """Return the neighbor list, or [] for an unknown node."""
    return graph.get(node, [])


def to_matrix(graph, order):
    """Return rows of 0/1 for edges from order[i] to order[j]."""
    rows = []
    for source in order:
        neighbors = graph.get(source, [])
        rows.append([1 if target in neighbors else 0 for target in order])
    return rows
