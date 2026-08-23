# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import countdown, position, reverse, total


@pytest.mark.concept("python.recursion.linear")
def test_deeper_input():
    expect_equal(countdown(10), [10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
    expect_equal(total(list(range(1, 51))), 1275)


@pytest.mark.concept("python.recursion.linear")
def test_totals_with_negatives_and_floats():
    expect_equal(total([-1, 1]), 0)
    expect_equal(total([0.5, 0.25]), 0.75)


@pytest.mark.concept("python.recursion.linear")
def test_reverse_a_palindrome_and_a_longer_word():
    expect_equal(reverse("aba"), "aba")
    expect_equal(reverse("recursion"), "noisrucer")


@pytest.mark.concept("python.recursion.linear")
def test_position_at_the_very_end():
    expect_equal(position([1, 2, 3, 4], 4), 3)


@pytest.mark.concept("python.recursion.linear")
def test_position_of_a_falsy_target():
    """Comparing with `if values[0]:` instead of `==` would skip a zero."""
    expect_equal(position([0, 1], 0), 0)
