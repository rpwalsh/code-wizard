"""The four ways to get the bounds wrong."""

import pytest

from retrainer.expect import expect_equal
from main import find, first_at_least, search_rotated, smallest_capacity


@pytest.mark.concept("python.algorithms.binary-search")
def test_the_two_ends_are_reachable():
    """`while low < high` never examines the last single candidate, so a target
    at either end is the case that exposes it."""
    values = [1, 3, 5, 7, 9]
    expect_equal(find(values, 1), 0)
    expect_equal(find(values, 9), 4)


@pytest.mark.concept("python.algorithms.binary-search")
def test_searching_nothing_and_one_thing():
    expect_equal(find([], 1), -1)
    expect_equal(find([1], 1), 0)
    expect_equal(find([1], 2), -1)
    expect_equal(first_at_least([], 1), 0)


@pytest.mark.concept("python.algorithms.binary-search")
def test_a_boundary_beyond_the_end():
    """Past everything means len(values), not -1 and not the last index."""
    expect_equal(first_at_least([1, 3, 5], 99), 3)
    expect_equal(first_at_least([1, 3, 5], 0), 0)


@pytest.mark.concept("python.algorithms.binary-search")
def test_boundary_lands_before_the_first_equal_value():
    """With duplicates the answer is the first one, not any one."""
    expect_equal(first_at_least([1, 5, 5, 5, 9], 5), 1)


@pytest.mark.concept("python.algorithms.binary-search")
def test_a_rotation_of_zero_is_still_sorted():
    expect_equal(search_rotated([1, 2, 3], 3), 2)
    expect_equal(search_rotated([1], 1), 0)
    expect_equal(search_rotated([], 1), -1)


@pytest.mark.concept("python.algorithms.binary-search")
def test_the_capacity_must_carry_the_heaviest_item():
    """The lower bound is not 1. Nothing smaller than the largest weight can
    ever ship, however many days there are."""
    expect_equal(smallest_capacity([9, 1, 1], 3), 9)


@pytest.mark.concept("python.algorithms.binary-search")
def test_one_day_means_carrying_everything():
    expect_equal(smallest_capacity([1, 2, 3], 1), 6)
