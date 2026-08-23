# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""What each function returns."""

import pytest

from retrainer.expect import expect_equal
from main import mutate, rebind, same_object, swap


@pytest.mark.concept("python.syntax.variables")
def test_swap_returns_the_pair_reversed():
    expect_equal(swap([1, 2]), [2, 1])


@pytest.mark.concept("python.syntax.variables")
def test_rebind_returns_the_new_list():
    expect_equal(rebind([1, 2]), ["fresh"])


@pytest.mark.concept("python.syntax.variables")
def test_mutate_returns_the_extended_list():
    expect_equal(mutate([1]), [1, "x"])


@pytest.mark.concept("python.syntax.variables")
def test_same_object():
    shared = [1]
    expect_equal(same_object(shared, shared), True)
