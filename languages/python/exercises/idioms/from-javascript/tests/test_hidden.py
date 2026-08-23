# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not cover."""

import pytest

from retrainer.expect import expect_equal
from main import by_newest, first_match, total_spend


@pytest.mark.concept("python.idioms.aggregation")
def test_sums_negative_amounts():
    expect_equal(total_spend([{"amount": 10}, {"amount": -4}]), 6)


@pytest.mark.concept("python.idioms.sorting")
def test_ties_keep_their_original_order():
    """Python's sort is stable, and the translation should not change that."""
    posts = [{"id": "a", "createdAt": 1}, {"id": "b", "createdAt": 1}]
    expect_equal([post["id"] for post in by_newest(posts)], ["a", "b"])


@pytest.mark.concept("python.idioms.sorting")
def test_sorting_nothing_is_an_empty_list():
    expect_equal(by_newest([]), [])


@pytest.mark.concept("python.collections.comprehensions")
def test_first_match_stops_at_the_first():
    seen = []

    def predicate(value):
        seen.append(value)
        return value == 2

    expect_equal(first_match([1, 2, 3], predicate), 2)
    expect_equal(seen, [1, 2])


@pytest.mark.concept("python.collections.comprehensions")
def test_a_falsy_first_match_is_still_a_match():
    """Returning `item or None` would turn a legitimate 0 into a miss."""
    expect_equal(first_match([0, 1], lambda value: True), 0)
