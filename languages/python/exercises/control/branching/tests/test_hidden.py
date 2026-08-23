# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import count_matching, describe, first_long, grade


@pytest.mark.concept("python.control.conditionals")
def test_grade_at_the_extremes():
    expect_equal(grade(100), "A")
    expect_equal(grade(0), "F")


@pytest.mark.concept("python.control.conditionals")
def test_describe_does_not_treat_zero_as_falsy():
    """`if number:` would send 0 down the wrong branch."""
    expect_equal(describe(0), "zero")


@pytest.mark.concept("python.control.conditionals")
def test_first_long_is_strictly_longer():
    expect_equal(first_long(["ab"], 2), None)
    expect_equal(first_long(["abc"], 2), "abc")


@pytest.mark.concept("python.control.conditionals")
def test_count_matching_is_case_sensitive():
    expect_equal(count_matching(["Apple", "apple"], "a"), 1)
