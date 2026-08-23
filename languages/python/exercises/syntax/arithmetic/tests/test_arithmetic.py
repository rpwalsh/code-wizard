# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The four operations, on ordinary numbers."""

import pytest

from retrainer.expect import expect_equal
from main import halves, is_even, remainder, whole_halves


@pytest.mark.concept("python.syntax.expressions")
def test_halves_keeps_the_fraction():
    expect_equal(halves(7), 3.5)


@pytest.mark.concept("python.syntax.expressions")
def test_whole_halves_throws_it_away():
    expect_equal(whole_halves(7), 3)


@pytest.mark.concept("python.syntax.expressions")
def test_remainder():
    expect_equal(remainder(7, 3), 1)
    expect_equal(remainder(9, 3), 0)


@pytest.mark.concept("python.syntax.expressions")
def test_is_even():
    expect_equal(is_even(4), True)
    expect_equal(is_even(7), False)
    expect_equal(is_even(0), True)
