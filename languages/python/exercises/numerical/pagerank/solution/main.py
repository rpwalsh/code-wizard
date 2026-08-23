# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""PageRank."""

DAMPING = 0.85
TOLERANCE = 1e-8
ROUND_LIMIT = 100


def distribute(graph, ranks):
    """One round with no damping. Dangling pages give to everyone equally."""
    pages = list(graph)
    if not pages:
        return {}

    received = {page: 0.0 for page in pages}
    for page in pages:
        links = graph.get(page, [])
        if not links:
            # A dangling page still has rank. Without this it vanishes, the
            # total shrinks every round, and the answer is quietly wrong.
            share = ranks[page] / len(pages)
            for target in pages:
                received[target] = received[target] + share
            continue
        share = ranks[page] / len(links)
        for target in links:
            received[target] = received[target] + share
    return received


def damped(graph, ranks, damping):
    """One round with damping applied."""
    pages = list(graph)
    if not pages:
        return {}
    received = distribute(graph, ranks)
    base = (1 - damping) / len(pages)
    return {page: base + damping * received[page] for page in pages}


def pagerank(graph, damping=DAMPING, tolerance=TOLERANCE, limit=ROUND_LIMIT):
    """Iterate until nothing moves by more than tolerance, or limit rounds."""
    pages = list(graph)
    if not pages:
        return {}

    ranks = {page: 1 / len(pages) for page in pages}
    rounds = 0
    while rounds < limit:
        updated = damped(graph, ranks, damping)
        moved = max(abs(updated[page] - ranks[page]) for page in pages)
        ranks = updated
        rounds = rounds + 1
        if moved <= tolerance:
            break
    return ranks


def ranking(ranks):
    """Return page names from highest rank to lowest, ties alphabetical."""
    return sorted(ranks, key=lambda page: (-ranks[page], page))
