# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import build_directed, build_undirected, neighbors_of, to_matrix


@pytest.mark.concept("python.structures.graph-representation")
def test_build_directed():
    expect_equal(build_directed([("a", "b")]), {"a": ["b"], "b": []})


@pytest.mark.concept("python.structures.graph-representation")
def test_build_undirected():
    expect_equal(build_undirected([("a", "b")]), {"a": ["b"], "b": ["a"]})


@pytest.mark.concept("python.structures.graph-representation")
def test_neighbors_of():
    graph = build_directed([("a", "b"), ("a", "c")])
    expect_equal(neighbors_of(graph, "a"), ["b", "c"])


@pytest.mark.concept("python.structures.graph-representation")
def test_to_matrix():
    graph = build_directed([("a", "b")])
    expect_equal(to_matrix(graph, ["a", "b"]), [[0, 1], [0, 0]])
