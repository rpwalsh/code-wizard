# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import collecting, counted, counting_from, evens_up_to, first


@pytest.mark.concept("python.advanced.generators")
def test_evens():
    expect_equal(list(evens_up_to(7)), [0, 2, 4, 6])


@pytest.mark.concept("python.advanced.generators")
def test_first_of_a_finite_sequence():
    expect_equal(first([1, 2, 3, 4], 2), [1, 2])


@pytest.mark.concept("python.advanced.generators")
def test_first_of_something_endless():
    """list() on this would never return. Laziness is the whole difference."""
    expect_equal(first(counting_from(10), 3), [10, 11, 12])


@pytest.mark.concept("python.advanced.decorators")
def test_counted_counts():
    @counted
    def double(value):
        return value * 2

    expect_equal(double(2), 4)
    expect_equal(double(3), 6)
    expect_equal(double.calls, 2)


@pytest.mark.concept("python.advanced.context-managers")
def test_collecting_records_both_ends():
    with collecting() as record:
        record.append("body")
    expect_equal(record, ["entered", "body", "cleaned"])
