# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import balanced, queue_order, stack_order, undo


@pytest.mark.concept("python.structures.stack-queue")
def test_balanced():
    expect_equal(balanced("(a[b]{c})"), True)
    expect_equal(balanced("(]"), False)


@pytest.mark.concept("python.structures.stack-queue")
def test_undo():
    expect_equal(undo(["a", "b", "undo"]), ["a"])


@pytest.mark.concept("python.structures.stack-queue")
def test_queue_takes_from_the_front():
    expect_equal(queue_order([1, 2, 3], 2), ([3], [1, 2]))


@pytest.mark.concept("python.structures.stack-queue")
def test_stack_takes_from_the_end():
    expect_equal(stack_order([1, 2, 3], 2), ([1], [3, 2]))
