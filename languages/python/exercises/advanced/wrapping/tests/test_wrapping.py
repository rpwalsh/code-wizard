# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases: counting, caching, retrying and defaulting."""

import pytest

from retrainer.expect import expect_equal, expect_true
from main import counted, defaulted, memoized, retried


@pytest.mark.concept("python.advanced.decorators")
def test_counted_counts_the_calls():
    @counted
    def greet(name):
        return f"hello {name}"

    expect_equal(greet("ada"), "hello ada")
    expect_equal(greet("bo"), "hello bo")
    expect_equal(greet.calls, 2)


@pytest.mark.concept("python.advanced.decorators")
def test_the_wrapper_keeps_the_name_of_what_it_wrapped():
    @counted
    def specific_name():
        """A docstring worth keeping."""
        return 1

    expect_equal(specific_name.__name__, "specific_name")
    expect_equal(specific_name.__doc__, "A docstring worth keeping.")


@pytest.mark.concept("python.advanced.decorators")
def test_memoized_runs_the_function_once_per_argument():
    calls = []

    @memoized
    def square(n):
        calls.append(n)
        return n * n

    expect_equal(square(4), 16)
    expect_equal(square(4), 16)
    expect_equal(square(5), 25)
    expect_equal(calls, [4, 5])


@pytest.mark.concept("python.advanced.decorators")
def test_retried_gives_up_after_the_last_attempt():
    attempts = []

    @retried(3)
    def flaky():
        attempts.append(1)
        raise ValueError("still broken")

    with pytest.raises(ValueError):
        flaky()

    expect_equal(len(attempts), 3)


@pytest.mark.concept("python.advanced.decorators")
def test_retried_stops_as_soon_as_it_works():
    attempts = []

    @retried(5)
    def eventually():
        attempts.append(1)
        if len(attempts) < 2:
            raise ValueError("not yet")
        return "worked"

    expect_equal(eventually(), "worked")
    expect_equal(len(attempts), 2)


@pytest.mark.concept("python.advanced.decorators")
def test_defaulted_substitutes_a_value_on_failure():
    @defaulted(0)
    def parse(text):
        return int(text)

    expect_equal(parse("12"), 12)
    expect_equal(parse("twelve"), 0)
