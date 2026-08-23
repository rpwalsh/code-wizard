# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Order, emptiness, and what is left open."""

import pytest

from retrainer.expect import expect_equal
from main import balanced, queue_order, stack_order, undo


@pytest.mark.concept("python.structures.stack-queue")
def test_unclosed_brackets_are_not_balanced():
    """Finishing with a non-empty stack is a different failure from a mismatch
    and has to be checked separately."""
    expect_equal(balanced("("), False)
    expect_equal(balanced("(()"), False)


@pytest.mark.concept("python.structures.stack-queue")
def test_a_closer_with_nothing_open():
    expect_equal(balanced(")"), False)
    expect_equal(balanced("()) "), False)


@pytest.mark.concept("python.structures.stack-queue")
def test_order_matters_not_just_the_counts():
    """`([)]` has one of each and is still wrong, which a counter would miss."""
    expect_equal(balanced("([)]"), False)
    expect_equal(balanced("([])"), True)


@pytest.mark.concept("python.structures.stack-queue")
def test_nothing_is_balanced():
    expect_equal(balanced(""), True)
    expect_equal(balanced("no brackets here"), True)


@pytest.mark.concept("python.structures.stack-queue")
def test_undo_with_nothing_to_cancel():
    expect_equal(undo(["undo"]), [])
    expect_equal(undo(["undo", "a"]), ["a"])


@pytest.mark.concept("python.structures.stack-queue")
def test_taking_more_than_there_is():
    expect_equal(queue_order([1], 5), ([], [1]))
    expect_equal(stack_order([], 3), ([], []))
