"""Degenerate k, and the tiebreak."""

import pytest

from retrainer.expect import expect_equal
from main import k_largest, k_smallest, merge_sorted_lists, most_common


@pytest.mark.concept("python.complexity.data-structure-choice")
def test_asking_for_none():
    expect_equal(k_largest([1, 2], 0), [])
    expect_equal(k_smallest([1, 2], 0), [])
    expect_equal(most_common({"a": 1}, 0), [])


@pytest.mark.concept("python.complexity.data-structure-choice")
def test_asking_for_exactly_one():
    """The smallest useful k, and the one a guard written as `k <= 1` swallows."""
    expect_equal(k_largest([5, 1, 9, 3], 1), [9])
    expect_equal(k_smallest([5, 1, 9, 3], 1), [1])
    expect_equal(most_common({"a": 1, "b": 2}, 1), ["b"])


@pytest.mark.concept("python.complexity.data-structure-choice")
def test_asking_for_more_than_there_is():
    """The heap never grows past what exists, so this must not raise."""
    expect_equal(k_largest([2, 1], 10), [2, 1])
    expect_equal(k_smallest([2, 1], 10), [1, 2])


@pytest.mark.concept("python.complexity.data-structure-choice")
def test_empty_inputs():
    expect_equal(k_largest([], 3), [])
    expect_equal(merge_sorted_lists([]), [])
    expect_equal(merge_sorted_lists([[], []]), [])


@pytest.mark.concept("python.structures.heap")
def test_ties_are_broken_alphabetically():
    expect_equal(most_common({"b": 5, "a": 5}, 2), ["a", "b"])


@pytest.mark.concept("python.structures.heap")
def test_duplicates_are_kept_not_collapsed():
    """A set-based shortcut would return one 9 here."""
    expect_equal(k_largest([9, 9, 1], 2), [9, 9])
