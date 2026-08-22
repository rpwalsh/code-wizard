"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import longest_unique, max_window_sum, pair_summing, remove_duplicates


@pytest.mark.concept("python.algorithms.two-pointer")
def test_pair_at_the_extremes():
    expect_equal(pair_summing([1, 2, 3, 9], 10), (0, 3))


@pytest.mark.concept("python.algorithms.two-pointer")
def test_pair_with_negatives():
    expect_equal(pair_summing([-5, -2, 0, 3], -2), (0, 3))


@pytest.mark.concept("python.algorithms.two-pointer")
def test_removal_leaves_a_longer_run_correct():
    values = [1, 1, 1, 2, 2, 3, 4, 4]
    count = remove_duplicates(values)
    expect_equal(count, 4)
    expect_equal(values[:count], [1, 2, 3, 4])


@pytest.mark.concept("python.algorithms.two-pointer")
def test_window_of_unique_characters_at_the_end():
    expect_equal(longest_unique("aab"), 2)
    expect_equal(longest_unique("abba"), 2)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_all_distinct_characters():
    expect_equal(longest_unique("abcdef"), 6)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_window_of_one_is_the_largest_single_value():
    expect_equal(max_window_sum([3, 9, 2], 1), 9)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_window_sum_does_not_disturb_the_input():
    values = [1, 2, 3]
    max_window_sum(values, 2)
    expect_equal(values, [1, 2, 3])
