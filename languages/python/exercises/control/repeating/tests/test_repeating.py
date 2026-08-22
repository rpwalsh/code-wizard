"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import all_below, first_negative, halve_until_small, sum_ignoring_negatives


@pytest.mark.concept("python.control.while")
def test_halving():
    expect_equal(halve_until_small(8), 4)
    expect_equal(halve_until_small(1), 1)


@pytest.mark.concept("python.control.loop-control")
def test_first_negative():
    expect_equal(first_negative([3, 1, -2, -9]), -2)
    expect_equal(first_negative([1, 2]), None)


@pytest.mark.concept("python.control.loop-control")
def test_sum_ignoring_negatives():
    expect_equal(sum_ignoring_negatives([1, -5, 2]), 3)


@pytest.mark.concept("python.control.loop-control")
def test_all_below():
    expect_equal(all_below([1, 2, 3], 10), True)
    expect_equal(all_below([1, 20], 10), False)
