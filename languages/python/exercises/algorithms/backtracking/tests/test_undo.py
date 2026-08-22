"""Copies, undos, and the empty cases."""

import pytest

from retrainer.expect import expect_equal
from main import combinations_summing, permutations, queens, subsets


@pytest.mark.concept("python.algorithms.backtracking")
def test_every_result_is_its_own_list():
    """Storing the working list instead of a copy leaves every result pointing
    at the same list, which ends up empty when the recursion unwinds."""
    found = subsets([1, 2, 3])
    expect_equal(len(found), 8)
    expect_equal(found[0], [])
    expect_equal(found[-1], [1, 2, 3])
    expect_equal(len({id(subset) for subset in found}), 8)


@pytest.mark.concept("python.algorithms.backtracking")
def test_the_empty_input():
    """One subset — the empty one — and one ordering, which is no ordering."""
    expect_equal(subsets([]), [[]])
    expect_equal(permutations([]), [[]])
    expect_equal(queens(0), 1)


@pytest.mark.concept("python.algorithms.backtracking")
def test_a_single_value():
    expect_equal(subsets([7]), [[], [7]])
    expect_equal(permutations([7]), [[7]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_a_target_that_cannot_be_reached():
    expect_equal(combinations_summing([5], 3), [])
    expect_equal(combinations_summing([], 3), [])


@pytest.mark.concept("python.algorithms.backtracking")
def test_a_target_of_zero_is_the_empty_combination():
    expect_equal(combinations_summing([1, 2], 0), [[]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_no_board_smaller_than_four_works_except_one():
    """Two and three queens cannot be placed at all, which is the case a
    solution that never prunes still gets right and slowly."""
    expect_equal(queens(2), 0)
    expect_equal(queens(3), 0)
