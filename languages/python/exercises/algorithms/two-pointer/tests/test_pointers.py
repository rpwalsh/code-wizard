# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import longest_unique, max_window_sum, pair_summing, remove_duplicates


@pytest.mark.concept("python.algorithms.two-pointer")
def test_pair_summing():
    expect_equal(pair_summing([1, 2, 4, 7], 6), (1, 2))
    expect_equal(pair_summing([1, 2, 4, 7], 100), None)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_remove_duplicates():
    values = [1, 1, 2, 3, 3]
    expect_equal(remove_duplicates(values), 3)
    expect_equal(values[:3], [1, 2, 3])


@pytest.mark.concept("python.algorithms.two-pointer")
def test_longest_unique():
    expect_equal(longest_unique("abcabcbb"), 3)
    expect_equal(longest_unique("bbbb"), 1)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_max_window_sum():
    expect_equal(max_window_sum([1, 2, 3, 4], 2), 7)
