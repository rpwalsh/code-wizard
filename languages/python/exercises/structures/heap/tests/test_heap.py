"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import k_largest, k_smallest, merge_sorted_lists, most_common


@pytest.mark.concept("python.structures.heap")
def test_k_largest():
    expect_equal(k_largest([5, 1, 9, 3], 2), [9, 5])


@pytest.mark.concept("python.structures.heap")
def test_k_smallest():
    expect_equal(k_smallest([5, 1, 9, 3], 2), [1, 3])


@pytest.mark.concept("python.structures.heap")
def test_merge_sorted_lists():
    expect_equal(merge_sorted_lists([[1, 4], [2, 3], [5]]), [1, 2, 3, 4, 5])


@pytest.mark.concept("python.structures.heap")
def test_most_common():
    expect_equal(most_common({"a": 3, "b": 9, "c": 1}, 2), ["b", "a"])
