"""Failure, emptiness, and what the wrapper hides."""

import pytest

from retrainer.expect import expect_equal
from main import collecting, counted, counting_from, evens_up_to, first


@pytest.mark.concept("python.advanced.context-managers")
def test_cleanup_happens_even_when_the_body_raises():
    """The case the context manager exists for. Without a finally, this is
    exactly the path that skips the cleanup."""
    record = None
    try:
        with collecting() as collected:
            record = collected
            raise ValueError("boom")
    except ValueError:
        pass
    expect_equal(record, ["entered", "cleaned"])


@pytest.mark.concept("python.advanced.context-managers")
def test_the_exception_is_not_swallowed():
    raised = False
    try:
        with collecting():
            raise ValueError("boom")
    except ValueError:
        raised = True
    expect_equal(raised, True)


@pytest.mark.concept("python.advanced.decorators")
def test_the_wrapper_keeps_the_original_name():
    """Without functools.wraps, everything that introspects sees a dozen
    functions all called wrapper."""

    @counted
    def specific_name():
        return 1

    expect_equal(specific_name.__name__, "specific_name")


@pytest.mark.concept("python.advanced.decorators")
def test_a_fresh_decoration_starts_at_zero():
    @counted
    def one():
        return 1

    @counted
    def two():
        return 2

    one()
    expect_equal(one.calls, 1)
    expect_equal(two.calls, 0)


@pytest.mark.concept("python.advanced.generators")
def test_taking_none_and_taking_more_than_there_is():
    expect_equal(first(counting_from(0), 0), [])
    # The smallest useful count, and the one a guard of `count <= 1` swallows.
    expect_equal(first(counting_from(9), 1), [9])
    expect_equal(first([7, 8], 1), [7])
    expect_equal(first([1, 2], 5), [1, 2])
    expect_equal(first([], 3), [])


@pytest.mark.concept("python.advanced.generators")
def test_evens_below_zero_and_one():
    expect_equal(list(evens_up_to(0)), [])
    expect_equal(list(evens_up_to(1)), [0])
    expect_equal(list(evens_up_to(2)), [0])
