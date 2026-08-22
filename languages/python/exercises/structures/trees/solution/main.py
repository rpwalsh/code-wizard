"""Binary trees."""


class Node:
    """A value, a left child and a right child."""

    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right


def in_order(root):
    """Return the values left, self, right."""
    if root is None:
        return []
    return in_order(root.left) + [root.value] + in_order(root.right)


def by_level(root):
    """Return the values top to bottom, left to right."""
    if root is None:
        return []
    values = []
    frontier = [root]
    while frontier:
        node = frontier.pop(0)
        values.append(node.value)
        if node.left is not None:
            frontier.append(node.left)
        if node.right is not None:
            frontier.append(node.right)
    return values


def _within(node, low, high):
    if node is None:
        return True
    if low is not None and node.value <= low:
        return False
    if high is not None and node.value >= high:
        return False
    return _within(node.left, low, node.value) and _within(node.right, node.value, high)


def is_search_tree(root):
    """Return True when the search-tree property holds all the way down."""
    return _within(root, None, None)


def common_ancestor(root, a, b):
    """Return the deepest node whose subtree contains both values."""
    node = root
    while node is not None:
        if a < node.value and b < node.value:
            node = node.left
        elif a > node.value and b > node.value:
            node = node.right
        else:
            return node
    return None
