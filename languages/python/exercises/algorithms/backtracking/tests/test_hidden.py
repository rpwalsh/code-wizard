# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import combinations_summing, permutations, queens, subsets


@pytest.mark.concept("python.algorithms.backtracking")
def test_subset_count_doubles_with_each_value():
    for size in range(6):
        expect_equal(len(subsets(list(range(size)))), 2**size)


@pytest.mark.concept("python.algorithms.backtracking")
def test_permutation_count_is_the_factorial():
    expect_equal(len(permutations([1, 2, 3])), 6)
    expect_equal(len(permutations([1, 2, 3, 4])), 24)


@pytest.mark.concept("python.algorithms.backtracking")
def test_permutations_of_three_in_order():
    expect_equal(
        permutations([1, 2, 3]),
        [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]],
    )


@pytest.mark.concept("python.algorithms.backtracking")
def test_combinations_do_not_repeat_in_a_different_order():
    """[2, 3] and [3, 2] are the same combination and only one may appear."""
    found = combinations_summing([2, 3, 5], 5)
    expect_equal(found, [[2, 3], [5]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_combinations_reuse_a_candidate():
    expect_equal(combinations_summing([3], 9), [[3, 3, 3]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_queens_further_up():
    expect_equal(queens(5), 10)
    expect_equal(queens(6), 4)


@pytest.mark.concept("python.algorithms.backtracking")
def test_the_input_is_not_disturbed():
    values = [2, 1]
    subsets(values)
    permutations(values)
    combinations_summing(values, 3)
    expect_equal(values, [2, 1])
