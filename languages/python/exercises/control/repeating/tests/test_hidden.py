# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import all_below, first_negative, halve_until_small, sum_ignoring_negatives


@pytest.mark.concept("python.control.while")
def test_halving_two():
    expect_equal(halve_until_small(2), 2)


@pytest.mark.concept("python.control.loop-control")
def test_first_negative_at_the_very_start():
    expect_equal(first_negative([-1, 5]), -1)


@pytest.mark.concept("python.control.loop-control")
def test_a_fraction_below_one_is_not_negative():
    """The guard is "negative", not "less than one". Skipping 0.5 would give
    1 here instead of 1.5, and no whole number could tell the difference."""
    expect_equal(sum_ignoring_negatives([0.5, 1]), 1.5)


@pytest.mark.concept("python.control.loop-control")
def test_zero_is_not_negative():
    expect_equal(first_negative([0, 1]), None)
    expect_equal(sum_ignoring_negatives([0, 5]), 5)


@pytest.mark.concept("python.control.loop-control")
def test_all_below_stops_at_the_first_failure():
    """Returning False from inside the loop rather than after it."""
    expect_equal(all_below([20, 1, 2], 10), False)
