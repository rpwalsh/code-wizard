"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import count_values, flatten, running_totals


@pytest.mark.concept("python.recursion.tree")
def test_flatten_preserves_order_across_branches():
    expect_equal(flatten([[1, 2], [3, [4, 5]], 6]), [1, 2, 3, 4, 5, 6])


@pytest.mark.concept("python.recursion.tree")
def test_values_that_are_falsy_still_count():
    expect_equal(count_values([0, [None, False]]), 3)
    expect_equal(flatten([0, [None]]), [0, None])


@pytest.mark.concept("python.recursion.accumulator")
def test_running_totals_of_one():
    expect_equal(running_totals([5]), [5])


@pytest.mark.concept("python.recursion.accumulator")
def test_running_totals_with_negatives():
    expect_equal(running_totals([5, -2, -3]), [5, 3, 0])


@pytest.mark.concept("python.recursion.accumulator")
def test_running_totals_does_not_disturb_the_input():
    original = [1, 2]
    running_totals(original)
    expect_equal(original, [1, 2])


@pytest.mark.concept("python.recursion.accumulator")
def test_running_totals_length_matches_the_input():
    expect_equal(len(running_totals([1, 1, 1, 1])), 4)
