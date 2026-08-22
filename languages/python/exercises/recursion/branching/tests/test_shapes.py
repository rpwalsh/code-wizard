"""Empty lists, lopsided nesting, and the two kinds of base case."""

import pytest

from retrainer.expect import expect_equal
from main import count_values, deepest, flatten, running_totals


@pytest.mark.concept("python.recursion.tree")
def test_the_empty_cases():
    expect_equal(flatten([]), [])
    expect_equal(count_values([]), 0)
    expect_equal(running_totals([]), [])


@pytest.mark.concept("python.recursion.tree")
def test_an_empty_list_is_one_level_deep():
    """`max` of nothing raises, so the empty case has to be handled before the
    combining step rather than inside it."""
    expect_equal(deepest([]), 1)
    expect_equal(deepest([1, 2, 3]), 1)


@pytest.mark.concept("python.recursion.tree")
def test_empty_lists_nested_inside():
    expect_equal(flatten([1, [], [2]]), [1, 2])
    expect_equal(count_values([[], []]), 0)
    expect_equal(deepest([[], []]), 2)


@pytest.mark.concept("python.recursion.tree")
def test_lopsided_nesting_takes_the_deepest_branch():
    expect_equal(deepest([1, [2], [[3]]]), 3)


@pytest.mark.concept("python.recursion.tree")
def test_deeply_nested_single_value():
    expect_equal(flatten([[[[1]]]]), [1])
    expect_equal(deepest([[[[1]]]]), 4)
