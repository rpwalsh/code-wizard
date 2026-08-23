# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import busiest, count_letters, invert


@pytest.mark.concept("python.collections.dict")
def test_invert():
    expect_equal(invert({"a": 1, "b": 2}), {1: "a", 2: "b"})


@pytest.mark.concept("python.collections.dict")
def test_count_letters():
    expect_equal(count_letters("aba"), {"a": 2, "b": 1})


@pytest.mark.concept("python.collections.dict")
def test_count_letters_ignores_spaces():
    expect_equal(count_letters("a b"), {"a": 1, "b": 1})


@pytest.mark.concept("python.collections.dict")
def test_busiest():
    expect_equal(busiest({"a": 1, "b": 9}), "b")
