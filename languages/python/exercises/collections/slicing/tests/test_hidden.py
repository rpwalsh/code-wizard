# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Exactly four elements, and a two-element list: the off-by-one boundaries."""

import pytest

from retrainer.expect import expect_equal
from main import backwards, first_three, last_two, middle


@pytest.mark.concept("python.collections.slicing")
def test_boundaries():
    expect_equal(first_three([1, 2, 3]), [1, 2, 3])
    expect_equal(first_three([1, 2, 3, 4]), [1, 2, 3])
    expect_equal(last_two([1, 2]), [1, 2])
    expect_equal(middle([1, 2]), [])
    expect_equal(backwards([1, 2]), [2, 1])


@pytest.mark.concept("python.collections.slicing")
def test_works_on_any_list_not_just_numbers():
    expect_equal(backwards(["a", "b", "c"]), ["c", "b", "a"])
    expect_equal(middle(["a", "b", "c"]), ["b"])
