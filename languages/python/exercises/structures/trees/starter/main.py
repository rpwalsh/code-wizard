# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Binary trees."""


class Node:
    """A value, a left child and a right child."""

    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right


def in_order(root):
    """Return the values left, self, right."""
    raise NotImplementedError


def by_level(root):
    """Return the values top to bottom, left to right."""
    raise NotImplementedError


def is_search_tree(root):
    """Return True when the search-tree property holds all the way down."""
    raise NotImplementedError


def common_ancestor(root, a, b):
    """Return the deepest node whose subtree contains both values."""
    raise NotImplementedError
