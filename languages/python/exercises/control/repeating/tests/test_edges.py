"""Loops that end immediately, and loops that must end at all."""

import pytest

from retrainer.expect import expect_equal
from main import all_below, halve_until_small, sum_ignoring_negatives


@pytest.mark.concept("python.control.while")
def test_a_loop_that_never_runs():
    """The condition can be false on the first look, and that is not an error."""
    expect_equal(halve_until_small(0), 0)


@pytest.mark.concept("python.control.while")
def test_halving_terminates_on_a_large_number():
    """Integer division reaches zero. Ordinary division never does, and this
    is the test that separates the two."""
    expect_equal(halve_until_small(1024), 11)


@pytest.mark.concept("python.control.loop-control")
def test_everything_skipped_is_still_a_total():
    expect_equal(sum_ignoring_negatives([-1, -2]), 0)
    expect_equal(sum_ignoring_negatives([]), 0)


@pytest.mark.concept("python.control.loop-control")
def test_nothing_is_vacuously_all_below():
    """An empty sequence satisfies "every value is below" — there is no value
    that is not."""
    expect_equal(all_below([], 10), True)


@pytest.mark.concept("python.control.loop-control")
def test_the_limit_itself_is_not_below():
    expect_equal(all_below([10], 10), False)
