"""The smallest inputs, which are the base cases."""

import pytest

from retrainer.expect import expect_equal
from main import countdown, position, reverse, total


@pytest.mark.concept("python.recursion.base-case")
def test_the_empty_cases():
    """A missing base case does not give a wrong answer. It gives
    RecursionError after a thousand identical frames."""
    expect_equal(countdown(0), [])
    expect_equal(total([]), 0)
    expect_equal(reverse(""), "")
    expect_equal(position([], 1), -1)


@pytest.mark.concept("python.recursion.base-case")
def test_a_single_item():
    expect_equal(countdown(1), [1])
    expect_equal(total([5]), 5)
    expect_equal(reverse("a"), "a")
    expect_equal(position([7], 7), 0)


@pytest.mark.concept("python.recursion.base-case")
def test_countdown_from_a_negative_still_stops():
    """The stopping condition has to hold for inputs below the base case too,
    or the recursion runs away in the other direction."""
    expect_equal(countdown(-3), [])


@pytest.mark.concept("python.recursion.linear")
def test_position_reports_the_first_occurrence():
    expect_equal(position([1, 2, 1], 1), 0)
