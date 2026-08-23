# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The four, used the ordinary way."""

import pytest

from retrainer.expect import expect_equal
from main import both_present, first_truthy, in_range, is_blank


@pytest.mark.concept("python.syntax.expressions")
def test_in_range_includes_both_ends():
    expect_equal(in_range(5, 1, 10), True)
    expect_equal(in_range(1, 1, 10), True)
    expect_equal(in_range(10, 1, 10), True)
    expect_equal(in_range(11, 1, 10), False)


@pytest.mark.concept("python.syntax.expressions")
def test_first_truthy():
    expect_equal(first_truthy("a", "b"), "a")
    expect_equal(first_truthy("", "b"), "b")


@pytest.mark.concept("python.syntax.expressions")
def test_both_present():
    expect_equal(both_present("a", "b"), True)
    expect_equal(both_present("a", ""), False)


@pytest.mark.concept("python.syntax.expressions")
def test_is_blank():
    expect_equal(is_blank(""), True)
    expect_equal(is_blank("   "), True)
    expect_equal(is_blank(" a "), False)
