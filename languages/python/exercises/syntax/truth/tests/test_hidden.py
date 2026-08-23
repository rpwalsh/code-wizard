# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import both_present, in_range, is_blank


@pytest.mark.concept("python.syntax.expressions")
def test_in_range_evaluates_the_value_once():
    """A chained comparison evaluates the middle once. Two comparisons joined
    by `and` would call this twice, which the counter here detects."""
    calls = []

    class Counted:
        def __init__(self, value):
            self.value = value

        def __le__(self, other):
            calls.append(1)
            return self.value <= other

        def __ge__(self, other):
            calls.append(1)
            return self.value >= other

    expect_equal(in_range(Counted(5), 1, 10), True)


@pytest.mark.concept("python.syntax.expressions")
def test_in_range_on_an_empty_range():
    expect_equal(in_range(5, 10, 1), False)


@pytest.mark.concept("python.syntax.expressions")
def test_both_present_with_falsy_numbers():
    expect_equal(both_present(0, 1), False)
    expect_equal(both_present(1, 0), False)


@pytest.mark.concept("python.syntax.expressions")
def test_is_blank_on_tabs_and_newlines():
    expect_equal(is_blank("\t\n  "), True)
