# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import best_take, fewest_coins, merge_ranges, ways_up


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_ways_up():
    expect_equal([ways_up(n) for n in range(6)], [1, 1, 2, 3, 5, 8])


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_best_take():
    expect_equal(best_take([2, 7, 9, 3, 1]), 12)


@pytest.mark.concept("python.algorithms.dynamic-programming")
def test_fewest_coins():
    expect_equal(fewest_coins([1, 5, 10], 27), 5)


@pytest.mark.concept("python.algorithms.intervals")
def test_merge_ranges():
    expect_equal(merge_ranges([(1, 3), (2, 6), (8, 10)]), [(1, 6), (8, 10)])
