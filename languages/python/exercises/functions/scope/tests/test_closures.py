# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import apply_twice, counter, make_adder, make_adders


@pytest.mark.concept("python.functions.scope")
def test_make_adder():
    expect_equal(make_adder(3)(4), 7)


@pytest.mark.concept("python.functions.scope")
def test_apply_twice():
    expect_equal(apply_twice(make_adder(1), 0), 2)


@pytest.mark.concept("python.functions.scope")
def test_counter_counts():
    tick = counter()
    expect_equal(tick(), 1)
    expect_equal(tick(), 2)
    expect_equal(tick(), 3)


@pytest.mark.concept("python.functions.scope")
def test_make_adders():
    adders = make_adders([1, 2])
    expect_equal(adders[0](10), 11)
    expect_equal(adders[1](10), 12)
