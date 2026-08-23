# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Emptiness, impossibility, and ranges that merely touch."""

import pytest

from retrainer.expect import expect_equal
from main import best_take, fewest_coins, merge_ranges, ways_up


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_doing_nothing_is_one_way():
    expect_equal(ways_up(0), 1)
    expect_equal(ways_up(1), 1)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_nonsense_inputs_answer_rather_than_raise():
    """Negative sizes are not errors here, they are simply impossible, and the
    guards that say so were never exercised."""
    expect_equal(ways_up(-1), 0)
    expect_equal(ways_up(-5), 0)
    expect_equal(fewest_coins([1], -1), -1)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_taking_from_nothing():
    expect_equal(best_take([]), 0)
    expect_equal(best_take([5]), 5)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_an_amount_that_cannot_be_made():
    """Unreachable has to stay distinguishable from merely expensive."""
    expect_equal(fewest_coins([5], 3), -1)
    expect_equal(fewest_coins([], 3), -1)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_the_smallest_amounts():
    """Only these need the answer for one. Every larger amount can route
    through a bigger coin, so a loop that starts one step late still gets 27
    right and gets 1 wrong."""
    expect_equal(fewest_coins([1, 5], 1), 1)
    expect_equal(fewest_coins([1, 5], 2), 2)
    expect_equal(fewest_coins([1, 5], 3), 3)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_zero_needs_no_coins():
    expect_equal(fewest_coins([1, 5], 0), 0)


@pytest.mark.concept("python.algorithms.intervals")
def test_touching_ranges_merge():
    """(1, 3) and (3, 5) share only an endpoint. Whether they merge is a
    decision, and this is the one this exercise made."""
    expect_equal(merge_ranges([(1, 3), (3, 5)]), [(1, 5)])


@pytest.mark.concept("python.algorithms.intervals")
def test_a_range_swallowed_by_another():
    """(2, 3) sits entirely inside (1, 10) and must not shorten it."""
    expect_equal(merge_ranges([(1, 10), (2, 3)]), [(1, 10)])


@pytest.mark.concept("python.algorithms.intervals")
def test_unsorted_input_and_emptiness():
    expect_equal(merge_ranges([(8, 10), (1, 3)]), [(1, 3), (8, 10)])
    expect_equal(merge_ranges([]), [])
