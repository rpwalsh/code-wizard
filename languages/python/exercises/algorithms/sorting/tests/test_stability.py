"""Ties, emptiness, and leaving the input alone."""

import pytest

from retrainer.expect import expect_equal
from main import insertion_sort, merge, merge_sort


@pytest.mark.concept("python.algorithms.sorting")
def test_merge_takes_the_left_value_on_a_tie():
    """Once you sort by two things, stability is what stops the second sort
    from destroying the first. It needs values that compare equal and are
    still tellable apart: 1 and 1.0 are equal, and only one of them is an int."""
    merged = merge([1], [1.0])
    expect_equal([type(value).__name__ for value in merged], ["int", "float"])


@pytest.mark.concept("python.algorithms.sorting")
def test_insertion_sort_is_stable_too():
    placed = insertion_sort([1, 1.0])
    expect_equal([type(value).__name__ for value in placed], ["int", "float"])


@pytest.mark.concept("python.algorithms.sorting")
def test_merging_with_an_empty_side():
    expect_equal(merge([], [1, 2]), [1, 2])
    expect_equal(merge([1, 2], []), [1, 2])
    expect_equal(merge([], []), [])


@pytest.mark.concept("python.algorithms.sorting")
def test_sorting_nothing_and_one_thing():
    expect_equal(merge_sort([]), [])
    expect_equal(merge_sort([1]), [1])
    expect_equal(insertion_sort([]), [])


@pytest.mark.concept("python.algorithms.sorting")
def test_already_sorted_and_reversed():
    expect_equal(merge_sort([1, 2, 3]), [1, 2, 3])
    expect_equal(merge_sort([3, 2, 1]), [1, 2, 3])
    expect_equal(insertion_sort([3, 2, 1]), [1, 2, 3])


@pytest.mark.concept("python.algorithms.sorting")
def test_the_input_is_not_disturbed():
    values = [3, 1, 2]
    merge_sort(values)
    insertion_sort(values)
    expect_equal(values, [3, 1, 2])


@pytest.mark.concept("python.algorithms.sorting")
def test_duplicates_are_all_kept():
    expect_equal(merge_sort([2, 1, 2, 1]), [1, 1, 2, 2])
    expect_equal(insertion_sort([2, 1, 2, 1]), [1, 1, 2, 2])
