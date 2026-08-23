# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The counterexample, and the empty cases."""

import pytest

from retrainer.expect import expect_equal
from main import Node, by_level, common_ancestor, in_order, is_search_tree


@pytest.mark.concept("python.structures.tree")
def test_local_checks_are_not_enough():
    """Root 10, left child 5, and that child has a right child of 20. Every
    parent-child comparison passes and the tree is still not a search tree,
    because 20 sits in the left subtree of 10."""
    tree = Node(10, Node(5, None, Node(20)), Node(30))
    expect_equal(is_search_tree(tree), False)


@pytest.mark.concept("python.structures.tree")
def test_the_range_narrows_on_the_right_side_too():
    tree = Node(10, Node(5), Node(30, Node(1), None))
    expect_equal(is_search_tree(tree), False)


@pytest.mark.concept("python.structures.tree")
def test_the_empty_tree():
    expect_equal(in_order(None), [])
    expect_equal(by_level(None), [])
    expect_equal(is_search_tree(None), True)
    expect_equal(common_ancestor(None, 1, 2), None)


@pytest.mark.concept("python.structures.tree")
def test_a_single_node():
    expect_equal(in_order(Node(1)), [1])
    expect_equal(by_level(Node(1)), [1])
    expect_equal(is_search_tree(Node(1)), True)


@pytest.mark.concept("python.structures.tree")
def test_equal_values_break_the_property():
    """Both sides, because the lower and upper bound are separate checks and
    only one of them fires for each."""
    expect_equal(is_search_tree(Node(5, Node(5), None)), False)
    expect_equal(is_search_tree(Node(5, None, Node(5))), False)


@pytest.mark.concept("python.structures.tree")
def test_a_node_is_its_own_ancestor():
    tree = Node(10, Node(5, Node(3), None), Node(15))
    expect_equal(common_ancestor(tree, 5, 3).value, 5)
