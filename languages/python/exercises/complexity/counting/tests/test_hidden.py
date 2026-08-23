# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import duplicate_count_fast, duplicate_count_slow, pair_count, scan_count


@pytest.mark.concept("python.complexity.counting")
def test_a_single_item_has_no_pairs():
    expect_equal(pair_count([1]), 0)


@pytest.mark.concept("python.complexity.counting")
def test_scanning_one_item():
    expect_equal(scan_count([1], 1), 1)
    expect_equal(scan_count([1], 2), 1)


@pytest.mark.concept("python.complexity.counting")
def test_repeated_values_stop_the_slow_list_from_growing():
    """All the same value: the list never grows past one, so the count stays
    linear even in the slow version."""
    expect_equal(duplicate_count_slow([7, 7, 7, 7]), 0 + 1 + 1 + 1)


@pytest.mark.concept("python.complexity.counting")
def test_the_fast_version_counts_every_item_regardless():
    expect_equal(duplicate_count_fast([7, 7, 7, 7]), 4)


@pytest.mark.concept("python.complexity.counting")
def test_scan_finds_the_first_match_not_a_later_one():
    expect_equal(scan_count([5, 1, 5], 5), 1)
