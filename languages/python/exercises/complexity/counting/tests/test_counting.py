# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The counts on small inputs, checkable by hand."""

import pytest

from retrainer.expect import expect_equal
from main import duplicate_count_fast, duplicate_count_slow, pair_count, scan_count


@pytest.mark.concept("python.complexity.counting")
def test_scan_stops_when_it_finds_it():
    expect_equal(scan_count([1, 2, 3], 1), 1)
    expect_equal(scan_count([1, 2, 3], 3), 3)


@pytest.mark.concept("python.complexity.counting")
def test_scan_of_a_missing_target_examines_everything():
    expect_equal(scan_count([1, 2, 3], 99), 3)


@pytest.mark.concept("python.complexity.counting")
def test_pairs_among_three_items():
    """(0,1), (0,2), (1,2) — three pairs, each counted once."""
    expect_equal(pair_count([1, 2, 3]), 3)


@pytest.mark.concept("python.complexity.counting")
def test_the_two_duplicate_finders_disagree():
    expect_equal(duplicate_count_fast([1, 2, 3, 4]), 4)
    expect_equal(duplicate_count_slow([1, 2, 3, 4]), 0 + 1 + 2 + 3)
