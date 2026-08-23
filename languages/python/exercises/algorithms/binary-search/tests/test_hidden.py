# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import find, first_at_least, search_rotated, smallest_capacity


@pytest.mark.concept("python.algorithms.binary-search")
def test_find_across_a_larger_range():
    values = list(range(0, 200, 2))
    for target in [0, 2, 100, 198]:
        expect_equal(find(values, target), target // 2)
    expect_equal(find(values, 199), -1)


@pytest.mark.concept("python.algorithms.binary-search")
def test_boundary_across_a_larger_range():
    values = list(range(0, 200, 2))
    expect_equal(first_at_least(values, 101), 51)
    expect_equal(first_at_least(values, 100), 50)


@pytest.mark.concept("python.algorithms.binary-search")
def test_rotation_at_every_offset():
    base = [1, 2, 3, 4, 5, 6, 7]
    for offset in range(len(base)):
        rotated = base[offset:] + base[:offset]
        for target in base:
            expect_equal(rotated[search_rotated(rotated, target)], target)


@pytest.mark.concept("python.algorithms.binary-search")
def test_rotated_search_rejects_a_missing_value():
    expect_equal(search_rotated([5, 6, 1, 2, 3], 4), -1)


@pytest.mark.concept("python.algorithms.binary-search")
def test_capacity_when_every_item_gets_its_own_day():
    expect_equal(smallest_capacity([3, 1, 4], 3), 4)


@pytest.mark.concept("python.algorithms.binary-search")
def test_capacity_of_nothing():
    expect_equal(smallest_capacity([], 5), 0)
