"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import minmax, rotate, split_first, totals


@pytest.mark.concept("python.collections.tuple")
def test_minmax():
    expect_equal(minmax([3, 1, 4]), (1, 4))


@pytest.mark.concept("python.collections.tuple")
def test_split_first():
    expect_equal(split_first([1, 2, 3]), (1, [2, 3]))


@pytest.mark.concept("python.collections.tuple")
def test_totals():
    expect_equal(totals([("a", 10), ("b", 5)]), 15)


@pytest.mark.concept("python.collections.tuple")
def test_rotate():
    expect_equal(rotate((1, 2, 3)), (2, 3, 1))
