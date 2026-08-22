"""What the boolean operators actually return."""

import pytest

from retrainer.expect import expect_equal
from main import both_present, first_truthy


@pytest.mark.concept("python.syntax.expressions")
def test_or_returns_an_operand_not_a_bool():
    """`"" or "fallback"` is the string, not True. This is what makes
    `value or default` useful, and what makes it a bug when 0 is legitimate."""
    expect_equal(first_truthy(0, 42), 42)
    expect_equal(first_truthy(None, "set"), "set")


@pytest.mark.concept("python.syntax.expressions")
def test_a_falsy_first_value_is_replaced():
    """Zero is a real number and an empty list is a real list. Both vanish."""
    expect_equal(first_truthy(0, 99), 99)
    expect_equal(first_truthy([], [1]), [1])


@pytest.mark.concept("python.syntax.expressions")
def test_both_present_is_a_real_bool():
    """`a and b` would return b itself, which is truthy but is not True."""
    expect_equal(both_present("a", "b") is True, True)
    expect_equal(both_present(1, 2) is True, True)
