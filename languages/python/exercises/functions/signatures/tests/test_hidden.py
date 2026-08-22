"""Signatures used in ways the visible tests did not."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import collect, join_words, tag


@pytest.mark.concept("python.functions.varargs")
def test_separator_cannot_be_passed_positionally():
    """It is keyword-only, which is the point of putting it after *words."""
    expect_equal(join_words("a", "b", "-"), "a b -")


@pytest.mark.concept("python.functions.varargs")
def test_an_empty_separator_still_works():
    expect_equal(join_words("a", "b", separator=""), "ab")


@pytest.mark.concept("python.functions.varargs")
def test_tag_needs_a_name():
    expect_raises(TypeError, lambda: tag())


@pytest.mark.concept("python.functions.varargs")
def test_collect_returns_the_same_list_it_was_given():
    existing = []
    expect_equal(collect(1, existing) is existing, True)
