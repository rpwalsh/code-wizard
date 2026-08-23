# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Calendars, runs and usage errors."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import add_days, days_between, parse_arguments, runs


@pytest.mark.concept("python.stdlib.datetime")
def test_crossing_a_month_and_a_year():
    expect_equal(add_days("2026-01-31", 1), "2026-02-01")
    expect_equal(add_days("2026-12-31", 1), "2027-01-01")


@pytest.mark.concept("python.stdlib.datetime")
def test_a_leap_year():
    """Adding 86400 seconds instead of a day gets this wrong once a year, on
    a machine that is not yours."""
    expect_equal(add_days("2028-02-28", 1), "2028-02-29")
    expect_equal(days_between("2028-02-28", "2028-03-01"), 2)


@pytest.mark.concept("python.stdlib.datetime")
def test_going_backwards_and_nowhere():
    expect_equal(days_between("2026-01-11", "2026-01-01"), -10)
    expect_equal(days_between("2026-01-01", "2026-01-01"), 0)
    expect_equal(add_days("2026-01-01", 0), "2026-01-01")
    expect_equal(add_days("2026-01-01", -1), "2025-12-31")


@pytest.mark.concept("python.stdlib.itertools")
def test_runs_group_what_is_next_to_what():
    """Not what is equal. The same value appearing twice apart is two runs."""
    expect_equal(runs([1, 1, 2, 1]), [(1, 2), (2, 1), (1, 1)])
    expect_equal(runs([]), [])
    expect_equal(runs("a"), [("a", 1)])


@pytest.mark.concept("python.engineering.cli")
def test_a_missing_name_is_a_usage_error():
    expect_raises(SystemExit, lambda: parse_arguments([]))
    expect_raises(SystemExit, lambda: parse_arguments(["--verbose"]))


@pytest.mark.concept("python.engineering.cli")
def test_a_flag_with_no_value_is_a_usage_error():
    expect_raises(SystemExit, lambda: parse_arguments(["--name"]))


@pytest.mark.concept("python.engineering.cli")
def test_an_unknown_flag_is_a_usage_error():
    expect_raises(SystemExit, lambda: parse_arguments(["--nope", "x"]))


@pytest.mark.concept("python.engineering.cli")
def test_the_exit_code_is_not_zero():
    """A shell can test a number. It cannot reliably test prose."""
    for argv in ([], ["--name"], ["--nope", "x"]):
        error = expect_raises(SystemExit, lambda: parse_arguments(argv))
        expect_equal(error.code, 2)
