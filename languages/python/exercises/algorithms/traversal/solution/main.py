# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Graph traversal."""


def reachable(graph, start):
    """Return the set of nodes reachable from start, including start."""
    return set(breadth_first(graph, start))


def breadth_first(graph, start):
    """Return nodes in visit order, taking from the front of the frontier."""
    seen = {start}
    frontier = [start]
    order = []
    while frontier:
        node = frontier.pop(0)
        order.append(node)
        for neighbor in graph.get(node, []):
            if neighbor in seen:
                continue
            seen.add(neighbor)
            frontier.append(neighbor)
    return order


def depth_first(graph, start):
    """Return nodes in visit order, taking from the end of the frontier."""
    seen = {start}
    frontier = [start]
    order = []
    while frontier:
        node = frontier.pop()
        order.append(node)
        for neighbor in graph.get(node, []):
            if neighbor in seen:
                continue
            seen.add(neighbor)
            frontier.append(neighbor)
    return order


def shortest_path(graph, start, goal):
    """Return the shortest route as a list of nodes, or None."""
    if start == goal:
        return [start]

    came_from = {start: None}
    frontier = [start]
    while frontier:
        node = frontier.pop(0)
        for neighbor in graph.get(node, []):
            if neighbor in came_from:
                continue
            came_from[neighbor] = node
            if neighbor == goal:
                return _walk_back(came_from, goal)
            frontier.append(neighbor)
    return None


def _walk_back(came_from, goal):
    route = []
    node = goal
    while node is not None:
        route.append(node)
        node = came_from[node]
    route.reverse()
    return route
