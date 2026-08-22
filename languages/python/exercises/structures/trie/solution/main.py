"""A prefix tree of nested dictionaries."""

END = "$"


def build(words):
    """Return the trie containing every word."""
    root = {}
    for word in words:
        node = root
        for character in word:
            node = node.setdefault(character, {})
        node[END] = True
    return root


def _descend(trie, text):
    node = trie
    for character in text:
        if character not in node:
            return None
        node = node[character]
    return node


def contains(trie, word):
    """True only when the exact word was stored."""
    node = _descend(trie, word)
    return node is not None and END in node


def starts_with(trie, prefix):
    """True when any stored word begins with the prefix."""
    return _descend(trie, prefix) is not None


def with_prefix(trie, prefix):
    """Every stored word beginning with the prefix, sorted."""
    node = _descend(trie, prefix)
    if node is None:
        return []

    found = []

    def collect(current, text):
        if END in current:
            found.append(text)
        for character in current:
            if character == END:
                continue
            collect(current[character], text + character)

    collect(node, prefix)
    return sorted(found)
