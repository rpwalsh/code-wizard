# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The three signatures, used the ordinary way."""

import pytest

from retrainer.expect import expect_equal
from main import collect, join_words, tag


@pytest.mark.concept("python.functions.varargs")
def test_joins_any_number_of_words():
    expect_equal(join_words("a", "b"), "a b")
    expect_equal(join_words("only"), "only")
    expect_equal(join_words(), "")


@pytest.mark.concept("python.functions.varargs")
def test_separator_is_keyword_only():
    expect_equal(join_words("a", "b", separator="-"), "a-b")


@pytest.mark.concept("python.functions.varargs")
def test_builds_a_tag():
    expect_equal(tag("a", href="/x"), '<a href="/x">')
    expect_equal(tag("br"), "<br>")


@pytest.mark.concept("python.functions.varargs")
def test_attributes_keep_their_order():
    expect_equal(tag("img", src="/a.png", alt="a"), '<img src="/a.png" alt="a">')


@pytest.mark.concept("python.functions.varargs")
def test_collects_into_a_given_list():
    existing = [1]
    expect_equal(collect(2, existing), [1, 2])
    expect_equal(existing, [1, 2])
