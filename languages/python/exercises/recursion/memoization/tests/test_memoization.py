# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The numbers themselves."""

import pytest

from retrainer.expect import expect_equal
from main import fib_fast, fib_naive


@pytest.mark.concept("python.recursion.memoization")
def test_the_first_few():
    expect_equal([fib_naive(n) for n in range(8)], [0, 1, 1, 2, 3, 5, 8, 13])


@pytest.mark.concept("python.recursion.memoization")
def test_the_cached_version_agrees():
    expect_equal([fib_fast(n) for n in range(8)], [0, 1, 1, 2, 3, 5, 8, 13])


@pytest.mark.concept("python.recursion.memoization")
def test_the_base_cases():
    expect_equal(fib_naive(0), 0)
    expect_equal(fib_naive(1), 1)
    expect_equal(fib_fast(0), 0)
    expect_equal(fib_fast(1), 1)
