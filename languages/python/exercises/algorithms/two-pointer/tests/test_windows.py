"""In-place really meaning in place, and windows at the edges."""

import pytest

from retrainer.expect import expect_equal
from main import longest_unique, max_window_sum, pair_summing, remove_duplicates


@pytest.mark.concept("python.algorithms.two-pointer")
def test_removal_changes_the_caller_list():
    """Building a new list and assigning it to the parameter rebinds a local
    name and the caller never sees it — the same trap as the very first lesson
    about names, four hundred lines of curriculum later."""
    values = [1, 1, 2]
    remove_duplicates(values)
    expect_equal(values[0], 1)
    expect_equal(values[1], 2)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_removal_on_the_degenerate_inputs():
    expect_equal(remove_duplicates([]), 0)
    expect_equal(remove_duplicates([7]), 1)
    expect_equal(remove_duplicates([7, 7, 7]), 1)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_removal_when_there_is_nothing_to_remove():
    """Every earlier case happens to start with a duplicate, which hides a
    read index that begins one position too late."""
    values = [1, 2, 3]
    expect_equal(remove_duplicates(values), 3)
    expect_equal(values, [1, 2, 3])


@pytest.mark.concept("python.algorithms.two-pointer")
def test_a_pair_needs_two_different_positions():
    """A single value equal to half the target is not a pair with itself."""
    expect_equal(pair_summing([3], 6), None)
    expect_equal(pair_summing([3, 3], 6), (0, 1))


@pytest.mark.concept("python.algorithms.two-pointer")
def test_empty_and_single_windows():
    expect_equal(longest_unique(""), 0)
    expect_equal(longest_unique("a"), 1)
    expect_equal(max_window_sum([], 1), 0)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_a_window_wider_than_the_data():
    expect_equal(max_window_sum([1, 2], 5), 0)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_the_whole_list_as_one_window():
    expect_equal(max_window_sum([1, 2, 3], 3), 6)


@pytest.mark.concept("python.algorithms.two-pointer")
def test_negative_values_in_the_window():
    """Starting the best at zero instead of the first window would be wrong
    here, because every window is negative."""
    expect_equal(max_window_sum([-5, -1, -4], 2), -5)
