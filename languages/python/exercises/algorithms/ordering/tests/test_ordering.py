# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import cheapest, count_regions, has_cycle, ordering


@pytest.mark.concept("python.algorithms.topological")
def test_count_regions():
    grid = ["##.", "#..", "..#"]
    expect_equal(count_regions(grid), 2)


@pytest.mark.concept("python.algorithms.topological")
def test_ordering():
    graph = {"a": ["b"], "b": ["c"], "c": []}
    expect_equal(ordering(graph), ["a", "b", "c"])


@pytest.mark.concept("python.algorithms.topological")
def test_a_cycle_has_no_ordering():
    graph = {"a": ["b"], "b": ["a"]}
    expect_equal(ordering(graph), None)
    expect_equal(has_cycle(graph), True)


@pytest.mark.concept("python.algorithms.shortest-path")
def test_cheapest():
    graph = {"a": [("b", 1), ("c", 5)], "b": [("c", 1)], "c": []}
    expect_equal(cheapest(graph, "a", "c"), 2)
