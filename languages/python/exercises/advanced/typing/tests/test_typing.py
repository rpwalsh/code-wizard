"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import describe_signature, initials, lookup, totals


@pytest.mark.concept("python.advanced.typing")
def test_initials():
    expect_equal(initials(["Alan", "Turing"]), "AT")


@pytest.mark.concept("python.advanced.typing")
def test_lookup():
    expect_equal(lookup({"a": 1}, "a"), 1)
    expect_equal(lookup({"a": 1}, "z"), None)


@pytest.mark.concept("python.advanced.typing")
def test_totals():
    rows = [{"x": 1, "y": 2}, {"x": 3}]
    expect_equal(totals(rows), {"x": 4, "y": 2})


@pytest.mark.concept("python.advanced.typing")
def test_describe_signature():
    expect_equal(describe_signature(lookup), ["dict[str, int]", "str"])
