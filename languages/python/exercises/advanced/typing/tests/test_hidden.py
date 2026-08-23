# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import describe_signature, initials, lookup, totals


@pytest.mark.concept("python.advanced.typing")
def test_initials_skips_empty_names():
    expect_equal(initials(["Ada", "", "Lovelace"]), "AL")


@pytest.mark.concept("python.advanced.typing")
def test_lookup_of_a_zero_value():
    """`records.get(key) or None` would turn a stored 0 into a miss."""
    expect_equal(lookup({"a": 0}, "a"), 0)


@pytest.mark.concept("python.advanced.typing")
def test_totals_across_disjoint_columns():
    expect_equal(totals([{"a": 1}, {"b": 2}]), {"a": 1, "b": 2})


@pytest.mark.concept("python.advanced.typing")
def test_totals_with_negative_values():
    expect_equal(totals([{"a": 5}, {"a": -2}]), {"a": 3})


@pytest.mark.concept("python.advanced.typing")
def test_describe_signature_keeps_parameter_order():
    expect_equal(describe_signature(totals), ["list[dict[str, int]]"])


@pytest.mark.concept("python.advanced.typing")
def test_describe_signature_excludes_the_return():
    for function in (initials, lookup, totals):
        expect_equal("return" not in describe_signature(function), True)
