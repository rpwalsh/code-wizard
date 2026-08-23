# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The four slices, on an ordinary list."""

import pytest

from retrainer.expect import expect_equal
from main import backwards, first_three, last_two, middle

NUMBERS = [1, 2, 3, 4, 5]


@pytest.mark.concept("python.collections.slicing")
def test_first_three():
    expect_equal(first_three(NUMBERS), [1, 2, 3])


@pytest.mark.concept("python.collections.slicing")
def test_last_two():
    expect_equal(last_two(NUMBERS), [4, 5])


@pytest.mark.concept("python.collections.slicing")
def test_middle():
    expect_equal(middle(NUMBERS), [2, 3, 4])


@pytest.mark.concept("python.collections.slicing")
def test_backwards():
    expect_equal(backwards(NUMBERS), [5, 4, 3, 2, 1])
