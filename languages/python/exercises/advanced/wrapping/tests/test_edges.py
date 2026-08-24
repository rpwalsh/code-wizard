# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The corners: falsy caches, arguments, and the error that must survive."""

import pytest

from retrainer.expect import expect_equal, expect_true
from main import counted, defaulted, memoized, retried


@pytest.mark.concept("python.advanced.decorators")
def test_a_cached_none_is_not_recomputed():
    """`if not cache.get(key)` recomputes every falsy result forever.

    None, 0, '' and False are all real answers, and a cache that cannot
    store them is a cache that quietly does nothing for them.
    """
    calls = []

    @memoized
    def nothing(n):
        calls.append(n)
        return None

    nothing(1)
    nothing(1)
    expect_equal(len(calls), 1)


@pytest.mark.concept("python.advanced.decorators")
def test_a_cached_zero_is_not_recomputed():
    calls = []

    @memoized
    def zero(n):
        calls.append(n)
        return 0

    expect_equal(zero(7), 0)
    expect_equal(zero(7), 0)
    expect_equal(len(calls), 1)


@pytest.mark.concept("python.advanced.decorators")
def test_arguments_pass_through_untouched():
    @counted
    def describe(a, b=2, *rest, key=None):
        return (a, b, rest, key)

    expect_equal(describe(1), (1, 2, (), None))
    expect_equal(describe(1, 3, 4, 5, key="x"), (1, 3, (4, 5), "x"))


@pytest.mark.concept("python.advanced.decorators")
def test_the_counter_is_per_decorated_function():
    @counted
    def first():
        return 1

    @counted
    def second():
        return 2

    first()
    first()
    second()

    # A counter kept outside the decorator is shared by everything it
    # decorated, which reports the wrong number for every one of them.
    expect_equal(first.calls, 2)
    expect_equal(second.calls, 1)


@pytest.mark.concept("python.advanced.decorators")
def test_retrying_once_still_calls_once():
    attempts = []

    @retried(1)
    def once():
        attempts.append(1)
        raise ValueError("no")

    with pytest.raises(ValueError):
        once()

    expect_equal(len(attempts), 1)


@pytest.mark.concept("python.advanced.decorators")
def test_a_nonsense_attempt_count_still_runs_the_function():
    attempts = []

    @retried(0)
    def never():
        attempts.append(1)
        return "ran"

    # Zero attempts would mean never calling it and returning None, which is
    # a silently wrong answer rather than a refusal.
    expect_equal(never(), "ran")
    expect_equal(len(attempts), 1)


@pytest.mark.concept("python.advanced.decorators")
def test_the_last_failure_is_the_one_that_escapes():
    @retried(3)
    def failing():
        raise ValueError("the real reason")

    with pytest.raises(ValueError) as caught:
        failing()

    # Re-raised, not wrapped: the caller wanted this function's error, not a
    # report that retrying did not work.
    expect_true("the real reason" in str(caught.value))


@pytest.mark.concept("python.advanced.decorators")
def test_defaulted_does_not_swallow_the_successful_falsy_result():
    @defaulted("fallback")
    def empty():
        return ""

    # An empty string is what the function returned, not a failure.
    expect_equal(empty(), "")


@pytest.mark.concept("python.advanced.decorators")
def test_decorators_stack():
    calls = []

    @counted
    @memoized
    def work(n):
        calls.append(n)
        return n * 2

    expect_equal(work(3), 6)
    expect_equal(work(3), 6)

    # Counted sees both calls; memoized let only the first through.
    expect_equal(work.calls, 2)
    expect_equal(len(calls), 1)
