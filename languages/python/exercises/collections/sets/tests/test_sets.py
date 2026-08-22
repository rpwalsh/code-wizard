"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import has_duplicates, only_in_first, shared, unique


@pytest.mark.concept("python.collections.set")
def test_unique():
    expect_equal(unique([1, 2, 1, 3]), [1, 2, 3])


@pytest.mark.concept("python.collections.set")
def test_shared():
    expect_equal(shared([1, 2, 3], [2, 3, 4]), [2, 3])


@pytest.mark.concept("python.collections.set")
def test_only_in_first():
    expect_equal(only_in_first([1, 2, 3], [2, 3, 4]), [1])


@pytest.mark.concept("python.collections.set")
def test_has_duplicates():
    expect_equal(has_duplicates([1, 2, 1]), True)
    expect_equal(has_duplicates([1, 2, 3]), False)
