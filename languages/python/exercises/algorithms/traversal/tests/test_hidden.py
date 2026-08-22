"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import breadth_first, depth_first, reachable, shortest_path


@pytest.mark.concept("python.algorithms.traversal")
def test_a_single_node():
    expect_equal(breadth_first({"a": []}, "a"), ["a"])
    expect_equal(depth_first({"a": []}, "a"), ["a"])
    expect_equal(reachable({"a": []}, "a"), {"a"})


@pytest.mark.concept("python.algorithms.traversal")
def test_a_start_node_missing_from_the_graph():
    expect_equal(breadth_first({}, "ghost"), ["ghost"])
    expect_equal(shortest_path({}, "ghost", "ghost"), ["ghost"])


@pytest.mark.concept("python.algorithms.traversal")
def test_only_the_reachable_part_is_visited():
    graph = {"a": ["b"], "b": [], "island": []}
    expect_equal(reachable(graph, "a"), {"a", "b"})


@pytest.mark.concept("python.algorithms.traversal")
def test_a_longer_chain_path():
    chain = {"a": ["b"], "b": ["c"], "c": ["d"], "d": []}
    expect_equal(shortest_path(chain, "a", "d"), ["a", "b", "c", "d"])


@pytest.mark.concept("python.algorithms.traversal")
def test_the_two_orders_visit_the_same_nodes():
    graph = {"a": ["b", "c"], "b": ["d"], "c": ["d", "e"], "d": [], "e": []}
    expect_equal(sorted(breadth_first(graph, "a")), sorted(depth_first(graph, "a")))


@pytest.mark.concept("python.algorithms.traversal")
def test_breadth_first_order_on_three_levels():
    graph = {"a": ["b", "c"], "b": ["d"], "c": ["e"], "d": [], "e": []}
    expect_equal(breadth_first(graph, "a"), ["a", "b", "c", "d", "e"])
