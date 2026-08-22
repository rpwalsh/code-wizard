"""Ordering, cycles and cheapest routes."""

import heapq


def count_regions(grid):
    """Count connected groups of "#" cells, four-directionally."""
    if not grid:
        return 0
    seen = set()
    regions = 0
    for row in range(len(grid)):
        for column in range(len(grid[row])):
            if grid[row][column] != "#" or (row, column) in seen:
                continue
            regions = regions + 1
            frontier = [(row, column)]
            seen.add((row, column))
            while frontier:
                r, c = frontier.pop()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr = r + dr
                    nc = c + dc
                    if nr < 0 or nr >= len(grid):
                        continue
                    if nc < 0 or nc >= len(grid[nr]):
                        continue
                    if grid[nr][nc] != "#" or (nr, nc) in seen:
                        continue
                    seen.add((nr, nc))
                    frontier.append((nr, nc))
    return regions


def ordering(graph):
    """Return a dependency-respecting order, ties alphabetical, or None."""
    waiting = {node: 0 for node in graph}
    for node in graph:
        for target in graph[node]:
            waiting[target] = waiting.get(target, 0) + 1

    ready = sorted(node for node in waiting if waiting[node] == 0)
    placed = []
    while ready:
        node = ready.pop(0)
        placed.append(node)
        for target in graph.get(node, []):
            waiting[target] = waiting[target] - 1
            if waiting[target] == 0:
                ready.append(target)
                ready.sort()

    if len(placed) != len(waiting):
        return None
    return placed


def has_cycle(graph):
    """Return True when the directed graph contains a cycle."""
    return ordering(graph) is None


def cheapest(graph, start, goal):
    """Return the cost of the cheapest route in a weighted graph, or None."""
    best = {start: 0}
    frontier = [(0, start)]
    while frontier:
        cost, node = heapq.heappop(frontier)
        # A cheaper route to this node was found after this entry was pushed;
        # the heap cannot be updated in place, so the stale entry is skipped.
        if cost > best.get(node, cost):
            continue
        if node == goal:
            return cost
        for neighbour, step in graph.get(node, []):
            total = cost + step
            if neighbour not in best or total < best[neighbour]:
                best[neighbour] = total
                heapq.heappush(frontier, (total, neighbour))
    return None
