"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import balanced, queue_order, stack_order, undo


@pytest.mark.concept("python.structures.stack-queue")
def test_deeply_nested_brackets():
    expect_equal(balanced("{[()()]}"), True)
    expect_equal(balanced("{[(])}"), False)


@pytest.mark.concept("python.structures.stack-queue")
def test_repeated_undo():
    expect_equal(undo(["a", "b", "undo", "undo"]), [])
    expect_equal(undo(["a", "undo", "b"]), ["b"])


@pytest.mark.concept("python.structures.stack-queue")
def test_taking_nothing_leaves_everything():
    expect_equal(queue_order([1, 2], 0), ([1, 2], []))
    expect_equal(stack_order([1, 2], 0), ([1, 2], []))


@pytest.mark.concept("python.structures.stack-queue")
def test_taking_does_not_disturb_the_original():
    original = [1, 2, 3]
    queue_order(original, 2)
    stack_order(original, 2)
    expect_equal(original, [1, 2, 3])


@pytest.mark.concept("python.structures.stack-queue")
def test_the_two_orders_are_reverses_of_each_other():
    _, from_front = queue_order([1, 2, 3], 3)
    _, from_back = stack_order([1, 2, 3], 3)
    expect_equal(from_front, list(reversed(from_back)))
