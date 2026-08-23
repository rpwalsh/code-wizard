# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Who sees the change, and who does not."""

import pytest

from retrainer.expect import expect_equal
from main import mutate, rebind, same_object, swap


@pytest.mark.concept("python.syntax.variables")
def test_swap_leaves_the_original_alone():
    original = [1, 2]
    swap(original)
    expect_equal(original, [1, 2])


@pytest.mark.concept("python.syntax.variables")
def test_rebinding_does_not_reach_the_caller():
    """Assigning to a parameter name points the local name somewhere new. The
    caller is still holding the old object and never hears about it."""
    original = [1, 2]
    rebind(original)
    expect_equal(original, [1, 2])


@pytest.mark.concept("python.syntax.variables")
def test_mutating_does_reach_the_caller():
    """The same-looking line, reaching through the name instead of past it."""
    original = [1]
    mutate(original)
    expect_equal(original, [1, "x"])


@pytest.mark.concept("python.syntax.variables")
def test_equal_is_not_the_same_as_identical():
    """Two separately built lists are equal and are not one object. A function
    that checks `is` when it meant `==` works on small ints and then fails."""
    expect_equal(same_object([1, 2], [1, 2]), False)
    expect_equal([1, 2] == [1, 2], True)
