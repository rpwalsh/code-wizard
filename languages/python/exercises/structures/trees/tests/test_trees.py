"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import Node, by_level, common_ancestor, in_order, is_search_tree

#        10
#      /    \
#     5      15
#    / \
#   3   7
TREE = Node(10, Node(5, Node(3), Node(7)), Node(15))


@pytest.mark.concept("python.structures.tree")
def test_in_order_comes_out_sorted():
    expect_equal(in_order(TREE), [3, 5, 7, 10, 15])


@pytest.mark.concept("python.structures.tree")
def test_by_level():
    expect_equal(by_level(TREE), [10, 5, 15, 3, 7])


@pytest.mark.concept("python.structures.tree")
def test_is_search_tree():
    expect_equal(is_search_tree(TREE), True)


@pytest.mark.concept("python.structures.tree")
def test_common_ancestor():
    expect_equal(common_ancestor(TREE, 3, 7).value, 5)
    expect_equal(common_ancestor(TREE, 3, 15).value, 10)
