# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import add_score, busiest, count_letters, invert


@pytest.mark.concept("python.collections.dict")
def test_counting_nothing():
    expect_equal(count_letters(""), {})
    expect_equal(count_letters("   "), {})


@pytest.mark.concept("python.collections.dict")
def test_counting_is_case_sensitive():
    expect_equal(count_letters("aA"), {"a": 1, "A": 1})


@pytest.mark.concept("python.collections.dict")
def test_inverting_duplicate_values_keeps_the_last():
    """Two keys mapping to one value cannot both survive the swap."""
    expect_equal(invert({"a": 1, "b": 1}), {1: "b"})


@pytest.mark.concept("python.collections.dict-mutation")
def test_adding_zero_still_creates_the_name():
    scores = {}
    add_score(scores, "a", 0)
    expect_equal(scores, {"a": 0})


@pytest.mark.concept("python.collections.dict-mutation")
def test_adding_negative_points():
    scores = {"a": 5}
    add_score(scores, "a", -2)
    expect_equal(scores, {"a": 3})


@pytest.mark.concept("python.collections.dict")
def test_busiest_with_one_entry():
    expect_equal(busiest({"only": 0}), "only")
