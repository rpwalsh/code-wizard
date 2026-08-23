# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import Node, has_cycle, merge_sorted, reverse, to_list


def chain(values):
    head = None
    for value in reversed(values):
        head = Node(value, head)
    return head


@pytest.mark.concept("python.structures.linked")
def test_to_list():
    expect_equal(to_list(chain([1, 2, 3])), [1, 2, 3])


@pytest.mark.concept("python.structures.linked")
def test_reverse():
    expect_equal(to_list(reverse(chain([1, 2, 3]))), [3, 2, 1])


@pytest.mark.concept("python.structures.linked")
def test_no_cycle():
    expect_equal(has_cycle(chain([1, 2, 3])), False)


@pytest.mark.concept("python.structures.linked")
def test_merge_sorted():
    expect_equal(to_list(merge_sorted(chain([1, 4]), chain([2, 3]))), [1, 2, 3, 4])
