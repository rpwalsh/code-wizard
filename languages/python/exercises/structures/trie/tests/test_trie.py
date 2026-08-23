# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import build, contains, starts_with, with_prefix


@pytest.fixture
def trie():
    """Built per test, not at import: a starter that raises would otherwise
    break collection instead of failing the tests."""
    return build(["car", "cart", "cat", "dog"])


@pytest.mark.concept("python.structures.trie")
def test_contains(trie):
    expect_equal(contains(trie, "car"), True)
    expect_equal(contains(trie, "dog"), True)
    expect_equal(contains(trie, "do"), False)


@pytest.mark.concept("python.structures.trie")
def test_starts_with(trie):
    expect_equal(starts_with(trie, "ca"), True)
    expect_equal(starts_with(trie, "zz"), False)


@pytest.mark.concept("python.structures.trie")
def test_with_prefix(trie):
    expect_equal(with_prefix(trie, "ca"), ["car", "cart", "cat"])


@pytest.mark.concept("python.structures.trie")
def test_with_prefix_of_a_whole_word(trie):
    expect_equal(with_prefix(trie, "dog"), ["dog"])
