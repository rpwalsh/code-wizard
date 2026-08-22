"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import count_matching, describe, first_long, grade


@pytest.mark.concept("python.control.conditionals")
def test_grades():
    expect_equal(grade(95), "A")
    expect_equal(grade(85), "B")
    expect_equal(grade(75), "C")
    expect_equal(grade(20), "F")


@pytest.mark.concept("python.control.conditionals")
def test_describe():
    expect_equal(describe(-3), "negative")
    expect_equal(describe(0), "zero")
    expect_equal(describe(3), "positive")


@pytest.mark.concept("python.control.conditionals")
def test_first_long():
    expect_equal(first_long(["a", "bb", "cccc"], 1), "bb")


@pytest.mark.concept("python.control.conditionals")
def test_count_matching():
    expect_equal(count_matching(["apple", "avocado", "pear"], "a"), 2)
