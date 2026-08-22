"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import insertion_sort, merge, merge_sort, scan


@pytest.mark.concept("python.algorithms.sorting")
def test_a_longer_shuffle():
    values = [17, 3, 99, 1, 42, 8, 23, 4, 56, 11]
    expect_equal(merge_sort(values), [1, 3, 4, 8, 11, 17, 23, 42, 56, 99])
    expect_equal(insertion_sort(values), merge_sort(values))


@pytest.mark.concept("python.algorithms.sorting")
def test_negative_and_zero():
    expect_equal(merge_sort([0, -5, 5, -1]), [-5, -1, 0, 5])


@pytest.mark.concept("python.algorithms.sorting")
def test_strings_sort_too():
    expect_equal(merge_sort(["pear", "apple", "fig"]), ["apple", "fig", "pear"])


@pytest.mark.concept("python.algorithms.sorting")
def test_merge_of_uneven_lengths():
    expect_equal(merge([1], [0, 2, 3]), [0, 1, 2, 3])


@pytest.mark.concept("python.algorithms.linear-search")
def test_scan_finds_every_occurrence_including_the_last():
    expect_equal(scan([7, 7, 7], 7), [0, 1, 2])
    expect_equal(scan([], 7), [])


@pytest.mark.concept("python.algorithms.sorting")
def test_insertion_sort_returns_a_new_list():
    values = [2, 1]
    expect_equal(insertion_sort(values) is values, False)
