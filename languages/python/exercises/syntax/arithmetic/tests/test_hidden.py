"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import halves, is_even, remainder, whole_halves


@pytest.mark.concept("python.syntax.expressions")
def test_zero():
    expect_equal(halves(0), 0.0)
    expect_equal(whole_halves(0), 0)
    expect_equal(remainder(0, 5), 0)


@pytest.mark.concept("python.syntax.expressions")
def test_negative_numbers_are_still_even_or_odd():
    expect_equal(is_even(-4), True)
    expect_equal(is_even(-7), False)


@pytest.mark.concept("python.syntax.expressions")
def test_group_larger_than_the_total():
    expect_equal(remainder(3, 10), 3)


@pytest.mark.concept("python.syntax.expressions")
def test_is_even_returns_a_bool_not_a_number():
    """`number % 2` alone is 0 or 1, which is falsy or truthy but not a bool."""
    expect_equal(is_even(4) is True, True)
    expect_equal(is_even(7) is False, True)
