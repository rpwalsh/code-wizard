"""What the caching actually buys."""

import pytest

from retrainer.expect import expect_equal
from main import cached_calls, fib_calls, fib_fast


@pytest.mark.concept("python.recursion.memoisation")
def test_the_naive_version_repeats_itself():
    """177 calls to compute the tenth Fibonacci number. Nothing about three
    lines of code suggests that, which is why counting beats reading."""
    expect_equal(fib_calls(10), 177)
    expect_equal(fib_calls(1), 1)
    expect_equal(fib_calls(5), 15)


@pytest.mark.concept("python.recursion.memoisation")
def test_the_cached_version_asks_each_question_about_once():
    """Exponential becomes linear: one call per distinct argument, plus the
    cache hits that stop each branch immediately."""
    expect_equal(cached_calls(10) < 25, True)
    expect_equal(cached_calls(0), 1)


@pytest.mark.concept("python.recursion.memoisation")
def test_the_cache_does_not_survive_between_calls():
    """A cache held in a default argument would persist, which is a different
    bug wearing the same clothes."""
    expect_equal(cached_calls(10), cached_calls(10))


@pytest.mark.concept("python.recursion.memoisation")
def test_the_cached_version_reaches_sixty_at_all():
    """The naive version would take longer than this test is allowed to run."""
    expect_equal(fib_fast(60), 1548008755920)
