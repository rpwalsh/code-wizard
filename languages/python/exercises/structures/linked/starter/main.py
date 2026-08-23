# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Linked structures."""


class Node:
    """A value and a link to the next node."""

    def __init__(self, value, next=None):
        self.value = value
        self.next = next


def to_list(head):
    """Return the values in order."""
    raise NotImplementedError


def reverse(head):
    """Reverse the chain and return the new head."""
    raise NotImplementedError


def has_cycle(head):
    """Return True when following next never ends. Two pointers, no set."""
    raise NotImplementedError


def merge_sorted(first, second):
    """Merge two sorted chains into one, reusing the nodes."""
    raise NotImplementedError
