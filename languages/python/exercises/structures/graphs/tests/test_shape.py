"""Nodes only ever pointed at, and the shape of the result."""

import pytest

from retrainer.expect import expect_equal
from main import build_directed, build_undirected, neighbours_of, to_matrix


@pytest.mark.concept("python.structures.graph-representation")
def test_a_node_with_no_outgoing_edges_still_gets_a_key():
    """Forgetting this does not fail here. It fails later, when a traversal
    reaches that node, asks for its neighbours, and raises KeyError."""
    graph = build_directed([("a", "b"), ("b", "c")])
    expect_equal(sorted(graph), ["a", "b", "c"])
    expect_equal(graph["c"], [])


@pytest.mark.concept("python.structures.graph-representation")
def test_an_unknown_node_has_no_neighbours_rather_than_raising():
    expect_equal(neighbours_of({}, "missing"), [])
    expect_equal(neighbours_of(build_directed([("a", "b")]), "zzz"), [])


@pytest.mark.concept("python.structures.graph-representation")
def test_an_empty_graph():
    expect_equal(build_directed([]), {})
    expect_equal(build_undirected([]), {})
    expect_equal(to_matrix({}, []), [])


@pytest.mark.concept("python.structures.graph-representation")
def test_direction_is_not_symmetric():
    """The whole difference between the two builders, in one assertion."""
    directed = build_directed([("a", "b")])
    expect_equal(directed["b"], [])
    expect_equal(build_undirected([("a", "b")])["b"], ["a"])


@pytest.mark.concept("python.structures.graph-representation")
def test_neighbour_lists_are_sorted():
    graph = build_directed([("a", "c"), ("a", "b")])
    expect_equal(graph["a"], ["b", "c"])
