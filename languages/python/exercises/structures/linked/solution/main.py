"""Linked structures."""


class Node:
    """A value and a link to the next node."""

    def __init__(self, value, next=None):
        self.value = value
        self.next = next


def to_list(head):
    """Return the values in order."""
    values = []
    while head is not None:
        values.append(head.value)
        head = head.next
    return values


def reverse(head):
    """Reverse the chain and return the new head."""
    previous = None
    current = head
    while current is not None:
        # Save the rest before overwriting the link that leads to it.
        ahead = current.next
        current.next = previous
        previous = current
        current = ahead
    return previous


def has_cycle(head):
    """Return True when following next never ends. Two pointers, no set."""
    slow = head
    fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False


def merge_sorted(first, second):
    """Merge two sorted chains into one, reusing the nodes."""
    # A throwaway node in front removes the special case for the first item.
    front = Node(None)
    tail = front
    while first is not None and second is not None:
        if first.value <= second.value:
            tail.next = first
            first = first.next
        else:
            tail.next = second
            second = second.next
        tail = tail.next
    if first is not None:
        tail.next = first
    else:
        tail.next = second
    return front.next
