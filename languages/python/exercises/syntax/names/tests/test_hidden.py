# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import mutate, same_object, swap


@pytest.mark.concept("python.syntax.variables")
def test_swap_returns_a_different_object():
    original = [1, 2]
    expect_equal(swap(original) is original, False)


@pytest.mark.concept("python.syntax.variables")
def test_swap_works_on_any_two_values():
    expect_equal(swap(["a", "b"]), ["b", "a"])
    expect_equal(swap([None, 0]), [0, None])


@pytest.mark.concept("python.syntax.variables")
def test_mutate_returns_the_very_same_object():
    original = []
    expect_equal(mutate(original) is original, True)


@pytest.mark.concept("python.syntax.variables")
def test_same_object_on_two_empty_lists():
    expect_equal(same_object([], []), False)
