# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import cheapest, count_regions, has_cycle, ordering


@pytest.mark.concept("python.algorithms.topological")
def test_a_diamond_ordering():
    graph = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}
    order = ordering(graph)
    expect_equal(order[0], "a")
    expect_equal(order[-1], "d")
    expect_equal(order.index("b") < order.index("d"), True)


@pytest.mark.concept("python.algorithms.topological")
def test_a_node_only_ever_pointed_at_still_appears():
    expect_equal(ordering({"a": ["b"]}), ["a", "b"])


@pytest.mark.concept("python.algorithms.topological")
def test_a_self_dependency_is_a_cycle():
    expect_equal(has_cycle({"a": ["a"]}), True)


@pytest.mark.concept("python.algorithms.topological")
def test_a_cycle_hidden_behind_a_valid_prefix():
    graph = {"a": ["b"], "b": ["c"], "c": ["b"]}
    expect_equal(ordering(graph), None)


@pytest.mark.concept("python.algorithms.topological")
def test_one_region_shaped_like_a_snake():
    grid = ["###", "..#", "###"]
    expect_equal(count_regions(grid), 1)


@pytest.mark.concept("python.algorithms.topological")
def test_ragged_rows_do_not_run_off_the_end():
    expect_equal(count_regions(["##", "#"]), 1)


@pytest.mark.concept("python.algorithms.shortest-path")
def test_cost_accumulates_along_a_chain():
    graph = {"a": [("b", 2)], "b": [("c", 3)], "c": [("d", 4)], "d": []}
    expect_equal(cheapest(graph, "a", "d"), 9)


@pytest.mark.concept("python.algorithms.shortest-path")
def test_a_zero_cost_edge():
    expect_equal(cheapest({"a": [("b", 0)], "b": []}, "a", "b"), 0)
