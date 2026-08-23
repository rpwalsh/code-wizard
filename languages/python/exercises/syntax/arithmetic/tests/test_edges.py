# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Where Python disagrees with most other languages."""

import pytest

from retrainer.expect import expect_equal
from main import halves, remainder, whole_halves


@pytest.mark.concept("python.syntax.expressions")
def test_dividing_exactly_still_gives_a_float():
    """`4 / 2` is 2.0, not 2. A float index raises, which is how this bites."""
    expect_equal(halves(4), 2.0)
    expect_equal(isinstance(halves(4), float), True)


@pytest.mark.concept("python.syntax.expressions")
def test_whole_halves_stays_an_int():
    expect_equal(isinstance(whole_halves(4), int), True)


@pytest.mark.concept("python.syntax.expressions")
def test_floor_division_floors_rather_than_truncating():
    """Most languages truncate towards zero. Python floors, so this is -4."""
    expect_equal(whole_halves(-7), -4)


@pytest.mark.concept("python.syntax.expressions")
def test_the_remainder_follows_the_divisor_sign():
    expect_equal(remainder(-7, 3), 2)
    expect_equal(remainder(7, -3), -2)
