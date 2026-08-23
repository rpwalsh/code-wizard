# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Words that are prefixes of other words."""

import pytest

from retrainer.expect import expect_equal
from main import build, contains, starts_with, with_prefix


@pytest.mark.concept("python.structures.trie")
def test_a_prefix_is_not_a_stored_word():
    """The whole point of the end marker. Without it this returns True and
    looks fine until someone stores both."""
    trie = build(["cart"])
    expect_equal(contains(trie, "car"), False)
    expect_equal(starts_with(trie, "car"), True)


@pytest.mark.concept("python.structures.trie")
def test_both_a_word_and_its_extension():
    trie = build(["car", "cart"])
    expect_equal(contains(trie, "car"), True)
    expect_equal(contains(trie, "cart"), True)
    expect_equal(with_prefix(trie, "car"), ["car", "cart"])


@pytest.mark.concept("python.structures.trie")
def test_the_empty_trie():
    trie = build([])
    expect_equal(contains(trie, "a"), False)
    expect_equal(with_prefix(trie, ""), [])
    expect_equal(starts_with(trie, ""), True)


@pytest.mark.concept("python.structures.trie")
def test_the_empty_prefix_matches_everything():
    trie = build(["a", "b"])
    expect_equal(with_prefix(trie, ""), ["a", "b"])
    expect_equal(starts_with(trie, ""), True)


@pytest.mark.concept("python.structures.trie")
def test_a_prefix_nothing_starts_with():
    trie = build(["cat"])
    expect_equal(with_prefix(trie, "dog"), [])
    expect_equal(starts_with(trie, "cats"), False)


@pytest.mark.concept("python.structures.trie")
def test_storing_the_empty_word():
    trie = build([""])
    expect_equal(contains(trie, ""), True)
    expect_equal(with_prefix(trie, ""), [""])
