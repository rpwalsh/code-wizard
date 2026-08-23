# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import cached_calls, fib_calls, fib_fast, fib_naive


@pytest.mark.concept("python.recursion.memoization")
def test_call_counts_at_the_bottom():
    expect_equal(fib_calls(0), 1)
    expect_equal(fib_calls(2), 3)
    expect_equal(fib_calls(3), 5)


@pytest.mark.concept("python.recursion.memoization")
def test_the_counts_follow_the_values():
    """The number of calls for n is one less than twice fib(n+1), which only
    holds if every branch is really being taken."""
    for n in range(2, 12):
        expect_equal(fib_calls(n), 2 * fib_naive(n + 1) - 1)


@pytest.mark.concept("python.recursion.memoization")
def test_the_cached_count_grows_gently():
    expect_equal(cached_calls(20) < 45, True)
    expect_equal(cached_calls(40) < 85, True)


@pytest.mark.concept("python.recursion.memoization")
def test_larger_values_agree_between_the_two():
    for n in [12, 15, 18]:
        expect_equal(fib_fast(n), fib_naive(n))
