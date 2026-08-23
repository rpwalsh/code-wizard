# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import build_directed, build_undirected, to_matrix


@pytest.mark.concept("python.structures.graph-representation")
def test_a_self_loop():
    expect_equal(build_directed([("a", "a")]), {"a": ["a"]})
    expect_equal(to_matrix(build_directed([("a", "a")]), ["a"]), [[1]])


@pytest.mark.concept("python.structures.graph-representation")
def test_a_longer_chain():
    graph = build_directed([("a", "b"), ("b", "c"), ("c", "d")])
    expect_equal(graph["b"], ["c"])
    expect_equal(graph["d"], [])


@pytest.mark.concept("python.structures.graph-representation")
def test_a_matrix_of_a_triangle():
    graph = build_undirected([("a", "b"), ("b", "c"), ("a", "c")])
    expect_equal(
        to_matrix(graph, ["a", "b", "c"]),
        [[0, 1, 1], [1, 0, 1], [1, 1, 0]],
    )


@pytest.mark.concept("python.structures.graph-representation")
def test_matrix_respects_the_given_order():
    graph = build_directed([("a", "b")])
    expect_equal(to_matrix(graph, ["b", "a"]), [[0, 0], [1, 0]])


@pytest.mark.concept("python.structures.graph-representation")
def test_matrix_of_a_subset_of_nodes():
    graph = build_directed([("a", "b"), ("b", "c")])
    expect_equal(to_matrix(graph, ["a", "b"]), [[0, 1], [0, 0]])
