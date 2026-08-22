"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import add_days, days_between, parse_arguments, runs


@pytest.mark.concept("python.stdlib.datetime")
def test_a_non_leap_century():
    expect_equal(add_days("2100-02-28", 1), "2100-03-01")


@pytest.mark.concept("python.stdlib.datetime")
def test_a_long_span():
    expect_equal(days_between("2026-01-01", "2027-01-01"), 365)
    expect_equal(add_days("2026-01-01", 365), "2027-01-01")


@pytest.mark.concept("python.stdlib.itertools")
def test_a_single_long_run():
    expect_equal(runs("aaaa"), [("a", 4)])


@pytest.mark.concept("python.stdlib.itertools")
def test_runs_of_numbers_and_of_nothing_repeated():
    expect_equal(runs([1, 2, 3]), [(1, 1), (2, 1), (3, 1)])


@pytest.mark.concept("python.engineering.cli")
def test_the_order_of_the_flags_does_not_matter():
    expect_equal(parse_arguments(["--verbose", "--name", "ada"]), ("ada", True))


@pytest.mark.concept("python.engineering.cli")
def test_a_name_that_looks_like_a_flag_is_still_a_name():
    expect_equal(parse_arguments(["--name", "--verbose"]), ("--verbose", False))


@pytest.mark.concept("python.engineering.cli")
def test_a_repeated_flag_takes_the_last_one():
    expect_equal(parse_arguments(["--name", "a", "--name", "b"]), ("b", False))
