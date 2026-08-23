# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import best_take, fewest_coins, merge_ranges, ways_up


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_ways_up_further():
    expect_equal(ways_up(10), 89)
    expect_equal(ways_up(20), 10946)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_best_take_prefers_skipping_when_it_pays():
    expect_equal(best_take([5, 1, 1, 5]), 10)
    expect_equal(best_take([2, 1, 1, 2]), 4)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_best_take_with_two_entries():
    expect_equal(best_take([3, 9]), 9)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_coins_prefers_the_larger_denomination():
    expect_equal(fewest_coins([1, 3, 4], 6), 2)
    expect_equal(fewest_coins([2], 4), 2)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_coins_of_an_exact_single_denomination():
    expect_equal(fewest_coins([7], 7), 1)


@pytest.mark.concept("python.algorithms.intervals")
def test_a_single_range_is_returned_as_is():
    expect_equal(merge_ranges([(4, 9)]), [(4, 9)])


@pytest.mark.concept("python.algorithms.intervals")
def test_several_merges_in_a_row():
    expect_equal(merge_ranges([(1, 2), (2, 3), (3, 4), (9, 10)]), [(1, 4), (9, 10)])


@pytest.mark.concept("python.algorithms.intervals")
def test_merging_does_not_disturb_the_input():
    ranges = [(3, 4), (1, 2)]
    merge_ranges(ranges)
    expect_equal(ranges, [(3, 4), (1, 2)])
