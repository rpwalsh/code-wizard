# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import countdown, numbered, pair_up


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_countdown_from_a_larger_number():
    expect_equal(countdown(5), [5, 4, 3, 2, 1])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_numbering_nothing():
    expect_equal(numbered([]), [])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_numbering_past_nine():
    expect_equal(numbered(list("abcdefghijk"))[-1], "11. k")


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_pairs_are_tuples_not_lists():
    expect_equal(isinstance(pair_up(["a"], [1])[0], tuple), True)
