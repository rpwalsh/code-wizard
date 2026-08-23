# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import add_days, days_between, parse_arguments, runs


@pytest.mark.concept("python.stdlib.datetime")
def test_days_between():
    expect_equal(days_between("2026-01-01", "2026-01-11"), 10)


@pytest.mark.concept("python.stdlib.datetime")
def test_add_days():
    expect_equal(add_days("2026-01-01", 10), "2026-01-11")


@pytest.mark.concept("python.stdlib.itertools")
def test_runs():
    expect_equal(runs("aabca"), [("a", 2), ("b", 1), ("c", 1), ("a", 1)])


@pytest.mark.concept("python.engineering.cli")
def test_parse_arguments():
    expect_equal(parse_arguments(["--name", "ada"]), ("ada", False))
    expect_equal(parse_arguments(["--name", "ada", "--verbose"]), ("ada", True))
