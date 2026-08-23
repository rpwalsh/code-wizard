# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Stack and queue drills."""

PARTNERS = {")": "(", "]": "[", "}": "{"}


def balanced(text):
    """Return True when every bracket is closed by its partner, in order."""
    open_brackets = []
    for character in text:
        if character in PARTNERS.values():
            open_brackets.append(character)
        elif character in PARTNERS:
            if not open_brackets:
                return False
            if open_brackets.pop() != PARTNERS[character]:
                return False
    return not open_brackets


def undo(actions):
    """Apply "undo" entries, canceling the previous remaining action."""
    surviving = []
    for action in actions:
        if action == "undo":
            if surviving:
                surviving.pop()
        else:
            surviving.append(action)
    return surviving


def queue_order(items, taken):
    """Take from the front. Return (remaining, taken_items)."""
    remaining = list(items)
    removed = []
    while taken > 0 and remaining:
        removed.append(remaining.pop(0))
        taken = taken - 1
    return remaining, removed


def stack_order(items, taken):
    """Take from the end. Return (remaining, taken_items)."""
    remaining = list(items)
    removed = []
    while taken > 0 and remaining:
        removed.append(remaining.pop())
        taken = taken - 1
    return remaining, removed
