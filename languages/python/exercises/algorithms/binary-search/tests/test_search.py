"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import find, first_at_least, search_rotated, smallest_capacity

SORTED = [1, 3, 5, 7, 9]


@pytest.mark.concept("python.algorithms.binary-search")
def test_find():
    expect_equal(find(SORTED, 5), 2)
    expect_equal(find(SORTED, 4), -1)


@pytest.mark.concept("python.algorithms.binary-search")
def test_first_at_least():
    expect_equal(first_at_least(SORTED, 5), 2)
    expect_equal(first_at_least(SORTED, 4), 2)


@pytest.mark.concept("python.algorithms.binary-search")
def test_search_rotated():
    expect_equal(search_rotated([4, 5, 6, 0, 1, 2], 0), 3)
    expect_equal(search_rotated([4, 5, 6, 0, 1, 2], 3), -1)


@pytest.mark.concept("python.algorithms.binary-search")
def test_smallest_capacity():
    expect_equal(smallest_capacity([1, 2, 3, 4, 5], 3), 6)
