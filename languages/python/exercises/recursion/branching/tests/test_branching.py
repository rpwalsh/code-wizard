# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import count_values, deepest, flatten, running_totals


@pytest.mark.concept("python.recursion.tree")
def test_flatten():
    expect_equal(flatten([1, [2, [3]], 4]), [1, 2, 3, 4])


@pytest.mark.concept("python.recursion.tree")
def test_deepest():
    expect_equal(deepest([1, [2]]), 2)
    expect_equal(deepest([1, [2, [3]]]), 3)


@pytest.mark.concept("python.recursion.tree")
def test_count_values():
    expect_equal(count_values([1, [2, [3]], 4]), 4)


@pytest.mark.concept("python.recursion.accumulator")
def test_running_totals():
    expect_equal(running_totals([1, 2, 3]), [1, 3, 6])
