# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import minmax, rotate, split_first, totals


@pytest.mark.concept("python.collections.tuple")
def test_minmax_with_negatives():
    expect_equal(minmax([-5, 0, 5]), (-5, 5))


@pytest.mark.concept("python.collections.tuple")
def test_rotate_is_left_not_right():
    """Rotating right would give (3, 1, 2), which is also a rotation."""
    expect_equal(rotate(("a", "b", "c")), ("b", "c", "a"))


@pytest.mark.concept("python.collections.tuple")
def test_totals_with_negative_amounts():
    expect_equal(totals([("a", 10), ("b", -4)]), 6)


@pytest.mark.concept("python.collections.tuple")
def test_split_first_does_not_disturb_the_original():
    original = [1, 2, 3]
    split_first(original)
    expect_equal(original, [1, 2, 3])
