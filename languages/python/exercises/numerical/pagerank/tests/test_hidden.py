"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_close, expect_equal
from main import damped, distribute, pagerank, ranking


@pytest.mark.concept("python.numerical.pagerank")
def test_one_page_pointing_nowhere():
    expect_close(pagerank({"only": []})["only"], 1.0, tolerance=1e-9)


@pytest.mark.concept("python.numerical.pagerank")
def test_a_page_splits_its_rank_between_its_links():
    graph = {"a": ["b", "c"], "b": [], "c": []}
    received = distribute(graph, {"a": 1.0, "b": 0.0, "c": 0.0})
    expect_close(received["b"], 0.5)
    expect_close(received["c"], 0.5)


@pytest.mark.concept("python.numerical.pagerank")
def test_damping_gives_every_page_a_floor():
    """Even a page nothing links to keeps (1 - damping) / n."""
    graph = {"a": ["a"], "lonely": ["a"]}
    ranks = damped(graph, {"a": 0.5, "lonely": 0.5}, 0.85)
    expect_equal(ranks["lonely"] > 0, True)


@pytest.mark.concept("python.numerical.pagerank")
def test_more_incoming_links_means_more_rank():
    graph = {"a": ["popular"], "b": ["popular"], "c": ["quiet"], "popular": [], "quiet": []}
    ranks = pagerank(graph)
    expect_equal(ranks["popular"] > ranks["quiet"], True)


@pytest.mark.concept("python.numerical.pagerank")
def test_the_default_damping_is_the_conventional_one():
    """Pins the answer the defaults produce. Damping of 0.86 shifts the last
    page from 0.0375 to 0.035, which this tolerance separates."""
    graph = {"a": ["b", "c"], "b": ["c"], "c": ["a"], "d": ["c"]}
    ranks = pagerank(graph)
    expect_close(ranks["a"], 0.372527, tolerance=1e-4)
    expect_close(ranks["d"], 0.0375, tolerance=1e-4)


@pytest.mark.concept("python.numerical.iteration")
def test_the_default_tolerance_is_tight_enough_to_have_converged():
    """A loose default would stop after one round, leaving every page still at
    its starting share."""
    graph = {"a": ["b", "c"], "b": ["c"], "c": ["a"], "d": ["c"]}
    ranks = pagerank(graph)
    expect_equal(abs(ranks["a"] - 0.25) > 0.05, True)


@pytest.mark.concept("python.numerical.pagerank")
def test_one_damped_round_of_nothing():
    expect_equal(damped({}, {}, 0.85), {})


@pytest.mark.concept("python.numerical.pagerank")
def test_ranking_breaks_ties_alphabetically():
    expect_equal(ranking({"b": 0.5, "a": 0.5}), ["a", "b"])


@pytest.mark.concept("python.numerical.pagerank")
def test_ranking_covers_every_page():
    ranks = pagerank({"a": ["b"], "b": ["a"], "c": []})
    expect_equal(sorted(ranking(ranks)), ["a", "b", "c"])
