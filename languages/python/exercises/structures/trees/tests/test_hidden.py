"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import Node, by_level, common_ancestor, in_order, is_search_tree


@pytest.mark.concept("python.structures.tree")
def test_a_chain_leaning_left():
    tree = Node(3, Node(2, Node(1), None), None)
    expect_equal(in_order(tree), [1, 2, 3])
    expect_equal(by_level(tree), [3, 2, 1])
    expect_equal(is_search_tree(tree), True)


@pytest.mark.concept("python.structures.tree")
def test_a_chain_leaning_right():
    tree = Node(1, None, Node(2, None, Node(3)))
    expect_equal(in_order(tree), [1, 2, 3])
    expect_equal(by_level(tree), [1, 2, 3])


@pytest.mark.concept("python.structures.tree")
def test_level_order_is_left_before_right():
    tree = Node(1, Node(2), Node(3))
    expect_equal(by_level(tree), [1, 2, 3])


@pytest.mark.concept("python.structures.tree")
def test_negative_values_are_ordered_too():
    tree = Node(0, Node(-5), Node(5))
    expect_equal(in_order(tree), [-5, 0, 5])
    expect_equal(is_search_tree(tree), True)


@pytest.mark.concept("python.structures.tree")
def test_ancestor_deep_on_one_side():
    tree = Node(20, Node(10, Node(5, Node(2), Node(7)), Node(15)), Node(30))
    expect_equal(common_ancestor(tree, 2, 7).value, 5)
    expect_equal(common_ancestor(tree, 2, 15).value, 10)
    expect_equal(common_ancestor(tree, 2, 30).value, 20)
