# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import Node, has_cycle, merge_sorted, reverse, to_list


def chain(values):
    head = None
    for value in reversed(values):
        head = Node(value, head)
    return head


@pytest.mark.concept("python.structures.linked")
def test_reversing_twice_restores_the_order():
    expect_equal(to_list(reverse(reverse(chain([1, 2, 3, 4])))), [1, 2, 3, 4])


@pytest.mark.concept("python.structures.linked")
def test_merging_reuses_nodes_rather_than_copying():
    first = chain([1])
    merged = merge_sorted(first, chain([2]))
    expect_equal(merged is first, True)


@pytest.mark.concept("python.structures.linked")
def test_merging_is_stable_when_values_are_equal():
    """With equal values the node from the first chain must come first. The
    output looks identical either way, so only identity can tell."""
    first = Node(1)
    second = Node(1)
    merged = merge_sorted(first, second)
    expect_equal(merged is first, True)
    expect_equal(merged.next is second, True)


@pytest.mark.concept("python.structures.linked")
def test_merging_equal_values_keeps_both():
    expect_equal(to_list(merge_sorted(chain([1, 1]), chain([1]))), [1, 1, 1])


@pytest.mark.concept("python.structures.linked")
def test_merging_uneven_lengths():
    expect_equal(to_list(merge_sorted(chain([1, 5, 9]), chain([2]))), [1, 2, 5, 9])


@pytest.mark.concept("python.structures.linked")
def test_a_cycle_that_starts_at_the_head():
    head = chain([1, 2])
    head.next.next = head
    expect_equal(has_cycle(head), True)


@pytest.mark.concept("python.structures.linked")
def test_a_longer_chain_reverses():
    expect_equal(to_list(reverse(chain(list(range(20))))), list(reversed(range(20))))
