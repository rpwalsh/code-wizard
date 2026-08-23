# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Where the return sits, and what the boundaries are."""

import pytest

from retrainer.expect import expect_equal
from main import count_matching, first_long, grade


@pytest.mark.concept("python.syntax.indentation")
def test_counting_continues_past_the_first_word():
    """`return total` one level too far in returns after the first word. The
    program still runs and still returns a number, and it is wrong."""
    expect_equal(count_matching(["ant", "bee", "ape"], "a"), 2)


@pytest.mark.concept("python.syntax.indentation")
def test_counting_nothing_is_zero_rather_than_None():
    """A total returned only from inside the loop never returns at all when
    the loop body never runs, and the function quietly gives None."""
    expect_equal(count_matching([], "a"), 0)
    expect_equal(count_matching(["pear"], "a"), 0)


@pytest.mark.concept("python.control.conditionals")
def test_searching_stops_at_the_first_match():
    expect_equal(first_long(["aa", "bbb", "cccc"], 1), "aa")


@pytest.mark.concept("python.control.conditionals")
def test_no_match_is_None():
    expect_equal(first_long(["a", "b"], 5), None)
    expect_equal(first_long([], 1), None)


@pytest.mark.concept("python.control.conditionals")
def test_grade_boundaries_are_exact():
    """Checking `>= 70` first would give 95 a C, and every input would still
    produce a plausible letter."""
    expect_equal(grade(90), "A")
    expect_equal(grade(89), "B")
    expect_equal(grade(80), "B")
    expect_equal(grade(79), "C")
    expect_equal(grade(70), "C")
    expect_equal(grade(69), "F")
