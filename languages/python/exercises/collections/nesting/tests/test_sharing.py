"""Missing levels, and rows that are secretly the same object."""

import pytest

from retrainer.expect import expect_equal
from main import all_tags, city_of, deep_copy_grid


@pytest.mark.concept("python.collections.nested")
def test_a_missing_level_is_None_rather_than_an_error():
    expect_equal(city_of({}), None)
    expect_equal(city_of({"address": {}}), None)


@pytest.mark.concept("python.collections.nested")
def test_a_post_without_tags_is_not_an_error():
    expect_equal(all_tags([{"title": "no tags"}]), [])
    expect_equal(all_tags([]), [])


@pytest.mark.concept("python.collections.nested")
def test_the_copy_shares_no_row():
    """`grid[:]` gives a new outer list holding the very same row objects, so
    appending to the copy also appends to the original. Every test that only
    checks the outer list passes, and the bug surfaces somewhere else."""
    original = [[1], [2]]
    copy = deep_copy_grid(original)
    copy[0].append(99)
    expect_equal(original, [[1], [2]])


@pytest.mark.concept("python.collections.nested")
def test_the_rows_are_different_objects():
    original = [[1]]
    expect_equal(deep_copy_grid(original)[0] is original[0], False)


@pytest.mark.concept("python.collections.nested")
def test_copying_an_empty_grid():
    expect_equal(deep_copy_grid([]), [])
    expect_equal(deep_copy_grid([[]]), [[]])
