# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""How the counts grow as the input does."""

import pytest

from retrainer.expect import expect_equal
from main import duplicate_count_fast, duplicate_count_slow, pair_count, scan_count


@pytest.mark.concept("python.complexity.growth")
def test_scanning_grows_in_step_with_the_input():
    """Ten times the items, ten times the work. That is linear, measured."""
    expect_equal(scan_count(list(range(10)), 999), 10)
    expect_equal(scan_count(list(range(100)), 999), 100)


@pytest.mark.concept("python.complexity.growth")
def test_pairs_grow_far_faster_than_the_input():
    """Ten times the items, roughly a hundred times the work."""
    expect_equal(pair_count(list(range(10))), 45)
    expect_equal(pair_count(list(range(100))), 4950)


@pytest.mark.concept("python.complexity.growth")
def test_the_pair_count_formula():
    for size in [0, 1, 2, 5, 20]:
        expect_equal(pair_count(list(range(size))), size * (size - 1) // 2)


@pytest.mark.concept("python.complexity.growth")
def test_the_set_version_stays_linear_while_the_list_version_does_not():
    """The same algorithm to look at. The only difference is what "have I seen
    this before" is asked of."""
    values = list(range(200))
    expect_equal(duplicate_count_fast(values), 200)
    expect_equal(duplicate_count_slow(values), 19900)


@pytest.mark.concept("python.complexity.counting")
def test_counting_nothing():
    expect_equal(scan_count([], 1), 0)
    expect_equal(pair_count([]), 0)
    expect_equal(duplicate_count_slow([]), 0)
    expect_equal(duplicate_count_fast([]), 0)
