"""Graph traversal."""


def reachable(graph, start):
    """Return the set of nodes reachable from start, including start."""
    raise NotImplementedError


def breadth_first(graph, start):
    """Return nodes in visit order, taking from the front of the frontier."""
    raise NotImplementedError


def depth_first(graph, start):
    """Return nodes in visit order, taking from the end of the frontier."""
    raise NotImplementedError


def shortest_path(graph, start, goal):
    """Return the shortest route as a list of nodes, or None."""
    raise NotImplementedError
