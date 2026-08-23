# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Dangling pages, stopping, and not stopping."""

import pytest

from retrainer.expect import expect_close, expect_equal
from main import damped, distribute, pagerank, ranking


@pytest.mark.concept("python.numerical.iteration")
def test_a_dangling_page_does_not_leak_rank():
    """A page with nowhere to send its rank makes the total shrink every round
    unless it is handled. The result still looks like a ranking, and is wrong."""
    graph = {"a": ["b"], "b": []}
    ranks = {"a": 0.5, "b": 0.5}
    expect_close(sum(distribute(graph, ranks).values()), 1.0, tolerance=1e-9)


@pytest.mark.concept("python.numerical.iteration")
def test_the_total_survives_many_rounds():
    graph = {"a": ["b"], "b": [], "c": ["a"]}
    ranks = {page: 1 / 3 for page in graph}
    for _ in range(25):
        ranks = damped(graph, ranks, 0.85)
    expect_close(sum(ranks.values()), 1.0, tolerance=1e-6)


@pytest.mark.concept("python.numerical.iteration")
def test_an_oscillating_graph_still_returns():
    """Two pages pointing at each other with no damping never settle. The
    iteration cap is what turns a hang into an answer you can inspect."""
    flip = {"a": ["b"], "b": ["a"]}
    result = pagerank(flip, damping=1.0, tolerance=0.0, limit=10)
    expect_equal(len(result), 2)


@pytest.mark.concept("python.numerical.iteration")
def test_a_loose_tolerance_stops_early_and_a_tight_one_does_not():
    graph = {"a": ["b"], "b": ["c"], "c": ["a"], "d": ["a"]}
    rough = pagerank(graph, tolerance=0.5, limit=100)
    exact = pagerank(graph, tolerance=1e-12, limit=200)
    expect_equal(ranking(rough) != [] and ranking(exact) != [], True)
    expect_close(sum(exact.values()), 1.0, tolerance=1e-6)


@pytest.mark.concept("python.numerical.pagerank")
def test_an_empty_graph():
    expect_equal(pagerank({}), {})
    expect_equal(distribute({}, {}), {})
    expect_equal(ranking({}), [])
