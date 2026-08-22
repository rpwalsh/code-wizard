"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import has_duplicates, only_in_first, shared, unique


@pytest.mark.concept("python.collections.set")
def test_duplicates_within_the_inputs_do_not_repeat_in_the_output():
    expect_equal(shared([1, 1, 2], [1, 2, 2]), [1, 2])
    expect_equal(only_in_first([1, 1, 3], [1]), [3])


@pytest.mark.concept("python.collections.set")
def test_empty_inputs():
    expect_equal(shared([], [1]), [])
    expect_equal(only_in_first([], [1]), [])
    expect_equal(has_duplicates([]), False)


@pytest.mark.concept("python.collections.set")
def test_difference_is_not_symmetric():
    """`only_in_first` is not the same question as "in one but not both"."""
    expect_equal(only_in_first([1], [1, 2]), [])


@pytest.mark.concept("python.collections.set")
def test_works_on_strings():
    expect_equal(unique("abca"), ["a", "b", "c"])
    expect_equal(has_duplicates("abc"), False)
