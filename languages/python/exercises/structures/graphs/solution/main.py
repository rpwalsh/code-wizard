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
    """Return {node: sorted neighbours}, each edge going both ways."""
    graph = {}
    for source, target in edges:
        graph.setdefault(source, [])
        graph.setdefault(target, [])
        graph[source].append(target)
        graph[target].append(source)
    return {node: sorted(neighbours) for node, neighbours in graph.items()}


def neighbours_of(graph, node):
    """Return the neighbour list, or [] for an unknown node."""
    return graph.get(node, [])


def to_matrix(graph, order):
    """Return rows of 0/1 for edges from order[i] to order[j]."""
    rows = []
    for source in order:
        neighbours = graph.get(source, [])
        rows.append([1 if target in neighbours else 0 for target in order])
    return rows
