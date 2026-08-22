"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import combinations_summing, permutations, queens, subsets


@pytest.mark.concept("python.algorithms.backtracking")
def test_subsets():
    expect_equal(subsets([1, 2]), [[], [1], [2], [1, 2]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_permutations():
    expect_equal(permutations([1, 2]), [[1, 2], [2, 1]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_combinations_summing():
    expect_equal(combinations_summing([2, 3], 6), [[2, 2, 2], [3, 3]])


@pytest.mark.concept("python.algorithms.backtracking")
def test_queens():
    expect_equal(queens(4), 2)
    expect_equal(queens(1), 1)
