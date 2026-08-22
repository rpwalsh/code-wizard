"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import insertion_sort, merge, merge_sort, scan


@pytest.mark.concept("python.algorithms.linear-search")
def test_scan():
    expect_equal(scan([1, 2, 1], 1), [0, 2])
    expect_equal(scan([1, 2], 9), [])


@pytest.mark.concept("python.algorithms.sorting")
def test_insertion_sort():
    expect_equal(insertion_sort([3, 1, 2]), [1, 2, 3])


@pytest.mark.concept("python.algorithms.sorting")
def test_merge():
    expect_equal(merge([1, 4], [2, 3]), [1, 2, 3, 4])


@pytest.mark.concept("python.algorithms.sorting")
def test_merge_sort():
    expect_equal(merge_sort([5, 3, 9, 1, 4]), [1, 3, 4, 5, 9])
