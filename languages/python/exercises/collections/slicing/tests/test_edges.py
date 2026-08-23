# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Slicing does not raise for being out of range. Prove you relied on that."""

import pytest

from retrainer.expect import expect_equal
from main import backwards, first_three, last_two, middle


@pytest.mark.concept("python.collections.slicing")
def test_short_lists_do_not_raise():
    expect_equal(first_three([1]), [1])
    expect_equal(last_two([1]), [1])
    expect_equal(middle([1]), [])


@pytest.mark.concept("python.collections.slicing")
def test_empty_list_stays_empty():
    expect_equal(first_three([]), [])
    expect_equal(last_two([]), [])
    expect_equal(middle([]), [])
    expect_equal(backwards([]), [])


@pytest.mark.concept("python.collections.slicing")
def test_the_original_is_not_disturbed():
    """A slice is a copy. If the original moved, you mutated it."""
    numbers = [1, 2, 3]
    backwards(numbers)
    middle(numbers)
    expect_equal(numbers, [1, 2, 3])
