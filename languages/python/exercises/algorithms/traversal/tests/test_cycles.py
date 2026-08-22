"""Cycles, dead ends, and nodes reached from two directions."""

import pytest

from retrainer.expect import expect_equal
from main import breadth_first, depth_first, reachable, shortest_path

# A cycle. Without a visited set every one of these runs forever.
CYCLE = {"a": ["b"], "b": ["c"], "c": ["a"]}


@pytest.mark.concept("python.algorithms.traversal")
def test_a_cycle_terminates():
    """This is the test the visited set exists for. Without it, nothing here
    returns at all."""
    expect_equal(breadth_first(CYCLE, "a"), ["a", "b", "c"])
    expect_equal(depth_first(CYCLE, "a"), ["a", "b", "c"])
    expect_equal(reachable(CYCLE, "a"), {"a", "b", "c"})


@pytest.mark.concept("python.algorithms.traversal")
def test_a_node_reached_from_two_places_appears_once():
    """Marking on removal rather than on adding lets this node be queued twice.
    It still comes out once, so the order looks right and the frontier grows."""
    diamond = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}
    expect_equal(breadth_first(diamond, "a").count("d"), 1)
    expect_equal(depth_first(diamond, "a").count("d"), 1)


@pytest.mark.concept("python.algorithms.traversal")
def test_a_self_loop_does_not_repeat():
    expect_equal(breadth_first({"a": ["a"]}, "a"), ["a"])


@pytest.mark.concept("python.algorithms.traversal")
def test_an_unreachable_goal():
    split = {"a": [], "b": []}
    expect_equal(shortest_path(split, "a", "b"), None)


@pytest.mark.concept("python.algorithms.traversal")
def test_the_path_to_yourself():
    expect_equal(shortest_path(CYCLE, "a", "a"), ["a"])


@pytest.mark.concept("python.algorithms.traversal")
def test_shortest_means_fewest_edges_not_first_found():
    """Depth-first would find a->b->c->d here. Breadth-first finds a->d."""
    graph = {"a": ["b", "d"], "b": ["c"], "c": ["d"], "d": []}
    expect_equal(shortest_path(graph, "a", "d"), ["a", "d"])
