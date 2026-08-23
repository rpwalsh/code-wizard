# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The thing a set gives up."""

import pytest

from retrainer.expect import expect_equal
from main import only_in_first, shared, unique


@pytest.mark.concept("python.collections.set")
def test_unique_keeps_first_appearance_order():
    """`list(set(items))` looks right, passes a careless test, and quietly
    reorders the data. This is the test that refuses it."""
    expect_equal(unique(["pear", "apple", "pear", "fig"]), ["pear", "apple", "fig"])
    expect_equal(unique([3, 1, 2, 1]), [3, 1, 2])


@pytest.mark.concept("python.collections.set")
def test_unique_of_nothing():
    expect_equal(unique([]), [])


@pytest.mark.concept("python.collections.set")
def test_unique_when_everything_is_distinct():
    expect_equal(unique([5, 4, 3]), [5, 4, 3])


@pytest.mark.concept("python.collections.set")
def test_results_are_sorted_lists_not_sets():
    expect_equal(isinstance(shared([1], [1]), list), True)
    expect_equal(isinstance(only_in_first([1], []), list), True)


@pytest.mark.concept("python.collections.set")
def test_nothing_in_common():
    expect_equal(shared([1], [2]), [])
    expect_equal(only_in_first([1], [1]), [])
