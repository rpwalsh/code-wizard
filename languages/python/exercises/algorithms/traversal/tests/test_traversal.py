# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases, on a small graph."""

import pytest

from retrainer.expect import expect_equal
from main import breadth_first, depth_first, reachable, shortest_path

# a -> b, c ;  b -> d ;  c -> d ;  d -> (nothing)
GRAPH = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}


@pytest.mark.concept("python.algorithms.traversal")
def test_reachable():
    expect_equal(reachable(GRAPH, "a"), {"a", "b", "c", "d"})
    expect_equal(reachable(GRAPH, "d"), {"d"})


@pytest.mark.concept("python.algorithms.traversal")
def test_breadth_first_visits_nearest_first():
    expect_equal(breadth_first(GRAPH, "a"), ["a", "b", "c", "d"])


@pytest.mark.concept("python.algorithms.traversal")
def test_depth_first_follows_one_path_down():
    expect_equal(depth_first(GRAPH, "a"), ["a", "c", "d", "b"])


@pytest.mark.concept("python.algorithms.traversal")
def test_shortest_path():
    expect_equal(shortest_path(GRAPH, "a", "d"), ["a", "b", "d"])
