# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The mutable default. This is the whole exercise."""

import pytest

from retrainer.expect import expect_equal
from main import collect


@pytest.mark.concept("python.functions.varargs")
def test_two_calls_with_no_list_do_not_share_one():
    """A default is evaluated once, at definition. `into=[]` would make every
    call append to the same list, and the second result would be [1, 2]."""
    expect_equal(collect(1), [1])
    expect_equal(collect(2), [2])


@pytest.mark.concept("python.functions.varargs")
def test_a_hundred_calls_still_do_not_share():
    for _ in range(100):
        expect_equal(collect("x"), ["x"])
