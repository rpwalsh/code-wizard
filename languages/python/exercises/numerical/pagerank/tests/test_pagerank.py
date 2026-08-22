"""Cases small enough to reason about."""

import pytest

from retrainer.expect import expect_close, expect_equal
from main import pagerank, ranking

# Everyone points at "hub" and nobody points back.
HUB = {"a": ["hub"], "b": ["hub"], "c": ["hub"], "hub": []}


@pytest.mark.concept("python.numerical.pagerank")
def test_the_ranks_sum_to_one():
    expect_close(sum(pagerank(HUB).values()), 1.0, tolerance=1e-6)


@pytest.mark.concept("python.numerical.pagerank")
def test_the_hub_wins():
    expect_equal(ranking(pagerank(HUB))[0], "hub")


@pytest.mark.concept("python.numerical.pagerank")
def test_a_symmetric_graph_gives_everyone_the_same():
    """Three pages in a ring: nothing distinguishes them, so nothing should."""
    ring = {"a": ["b"], "b": ["c"], "c": ["a"]}
    ranks = pagerank(ring)
    expect_close(ranks["a"], 1 / 3, tolerance=1e-6)
    expect_close(ranks["b"], 1 / 3, tolerance=1e-6)


@pytest.mark.concept("python.numerical.pagerank")
def test_ranking_orders_high_to_low():
    expect_equal(ranking({"a": 0.1, "b": 0.5, "c": 0.4}), ["b", "c", "a"])
