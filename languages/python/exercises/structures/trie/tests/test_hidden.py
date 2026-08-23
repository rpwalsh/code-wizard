# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import build, contains, starts_with, with_prefix


@pytest.mark.concept("python.structures.trie")
def test_storing_the_same_word_twice():
    trie = build(["cat", "cat"])
    expect_equal(with_prefix(trie, "c"), ["cat"])


@pytest.mark.concept("python.structures.trie")
def test_words_sharing_no_prefix():
    trie = build(["apple", "banana", "cherry"])
    expect_equal(with_prefix(trie, ""), ["apple", "banana", "cherry"])
    expect_equal(starts_with(trie, "ban"), True)


@pytest.mark.concept("python.structures.trie")
def test_a_single_character_word():
    trie = build(["a", "ab"])
    expect_equal(contains(trie, "a"), True)
    expect_equal(with_prefix(trie, "a"), ["a", "ab"])


@pytest.mark.concept("python.structures.trie")
def test_a_longer_word_than_anything_stored():
    trie = build(["ab"])
    expect_equal(contains(trie, "abcdef"), False)
    expect_equal(starts_with(trie, "abcdef"), False)


@pytest.mark.concept("python.structures.trie")
def test_results_come_back_sorted():
    trie = build(["cz", "ca", "cm"])
    expect_equal(with_prefix(trie, "c"), ["ca", "cm", "cz"])


@pytest.mark.concept("python.structures.trie")
def test_the_marker_is_not_returned_as_a_character():
    """Walking every key of a node without skipping the end marker would put
    a dollar sign into the collected words."""
    trie = build(["ab"])
    expect_equal(with_prefix(trie, ""), ["ab"])
