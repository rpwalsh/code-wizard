"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import k_largest, k_smallest, merge_sorted_lists, most_common


@pytest.mark.concept("python.structures.heap")
def test_negative_values():
    expect_equal(k_largest([-5, -1, -9], 2), [-1, -5])
    expect_equal(k_smallest([-5, -1, -9], 2), [-9, -5])


@pytest.mark.concept("python.structures.heap")
def test_the_whole_list_in_order():
    values = [4, 2, 8, 6]
    expect_equal(k_largest(values, 4), [8, 6, 4, 2])
    expect_equal(k_smallest(values, 4), [2, 4, 6, 8])


@pytest.mark.concept("python.structures.heap")
def test_merging_lists_of_unequal_length():
    expect_equal(merge_sorted_lists([[1], [2, 3, 4], [0, 9]]), [0, 1, 2, 3, 4, 9])


@pytest.mark.concept("python.structures.heap")
def test_merging_keeps_duplicates_across_lists():
    expect_equal(merge_sorted_lists([[1, 1], [1]]), [1, 1, 1])


@pytest.mark.concept("python.structures.heap")
def test_merging_a_single_list_is_that_list():
    expect_equal(merge_sorted_lists([[3, 5, 7]]), [3, 5, 7])


@pytest.mark.concept("python.structures.heap")
def test_most_common_across_a_larger_map():
    counts = {"a": 1, "b": 2, "c": 3, "d": 3}
    expect_equal(most_common(counts, 3), ["c", "d", "b"])


@pytest.mark.concept("python.structures.heap")
def test_k_largest_does_not_disturb_the_input():
    values = [3, 1, 2]
    k_largest(values, 2)
    expect_equal(values, [3, 1, 2])
