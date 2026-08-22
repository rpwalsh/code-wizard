"""Empty chains, single nodes, and loops."""

import pytest

from retrainer.expect import expect_equal
from main import Node, has_cycle, merge_sorted, reverse, to_list


def chain(values):
    head = None
    for value in reversed(values):
        head = Node(value, head)
    return head


@pytest.mark.concept("python.structures.linked")
def test_the_empty_chain():
    expect_equal(to_list(None), [])
    expect_equal(reverse(None), None)
    expect_equal(has_cycle(None), False)
    expect_equal(merge_sorted(None, None), None)


@pytest.mark.concept("python.structures.linked")
def test_a_single_node():
    expect_equal(to_list(reverse(chain([7]))), [7])
    expect_equal(has_cycle(chain([7])), False)


@pytest.mark.concept("python.structures.linked")
def test_a_cycle_is_found():
    """The fast pointer laps the slow one. A chain with no end would hang any
    traversal that assumed it terminates."""
    head = chain([1, 2, 3, 4])
    last = head
    while last.next is not None:
        last = last.next
    last.next = head.next
    expect_equal(has_cycle(head), True)


@pytest.mark.concept("python.structures.linked")
def test_a_node_pointing_at_itself():
    node = Node(1)
    node.next = node
    expect_equal(has_cycle(node), True)


@pytest.mark.concept("python.structures.linked")
def test_merging_when_one_side_is_empty():
    expect_equal(to_list(merge_sorted(chain([1, 2]), None)), [1, 2])
    expect_equal(to_list(merge_sorted(None, chain([3]))), [3])


@pytest.mark.concept("python.structures.linked")
def test_the_old_head_becomes_the_tail():
    """After reversing, the node that was first must now end the chain. A
    version that forgets to break the old link leaves a cycle behind."""
    head = chain([1, 2, 3])
    reversed_head = reverse(head)
    expect_equal(has_cycle(reversed_head), False)
    expect_equal(head.next, None)
