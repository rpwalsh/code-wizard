"""A prefix tree of nested dictionaries."""

END = "$"


def build(words):
    """Return the trie containing every word."""
    raise NotImplementedError


def contains(trie, word):
    """True only when the exact word was stored."""
    raise NotImplementedError


def starts_with(trie, prefix):
    """True when any stored word begins with the prefix."""
    raise NotImplementedError


def with_prefix(trie, prefix):
    """Every stored word beginning with the prefix, sorted."""
    raise NotImplementedError
