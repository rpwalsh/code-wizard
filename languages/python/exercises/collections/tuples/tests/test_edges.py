"""Shapes, emptiness, and what comes back as what."""

import pytest

from retrainer.expect import expect_equal
from main import minmax, rotate, split_first, totals


@pytest.mark.concept("python.collections.tuple")
def test_a_single_item_is_its_own_min_and_max():
    expect_equal(minmax([7]), (7, 7))


@pytest.mark.concept("python.collections.tuple")
def test_splitting_one_item_leaves_an_empty_rest():
    expect_equal(split_first([1]), (1, []))


@pytest.mark.concept("python.collections.tuple")
def test_splitting_nothing():
    expect_equal(split_first([]), (None, []))


@pytest.mark.concept("python.collections.tuple")
def test_the_rest_is_a_list_even_from_a_tuple():
    """Star-unpacking always collects into a list, whatever it unpacked."""
    first, rest = split_first((1, 2, 3))
    expect_equal(first, 1)
    expect_equal(rest, [2, 3])
    expect_equal(isinstance(rest, list), True)


@pytest.mark.concept("python.collections.tuple")
def test_results_are_tuples_not_lists():
    expect_equal(isinstance(minmax([1, 2]), tuple), True)
    expect_equal(isinstance(rotate((1, 2, 3)), tuple), True)


@pytest.mark.concept("python.collections.tuple")
def test_totalling_nothing_is_zero():
    expect_equal(totals([]), 0)
