"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import countdown, position, reverse, total


@pytest.mark.concept("python.recursion.linear")
def test_countdown():
    expect_equal(countdown(3), [3, 2, 1])


@pytest.mark.concept("python.recursion.linear")
def test_total():
    expect_equal(total([1, 2, 3]), 6)


@pytest.mark.concept("python.recursion.linear")
def test_reverse():
    expect_equal(reverse("abc"), "cba")


@pytest.mark.concept("python.recursion.linear")
def test_position():
    expect_equal(position([10, 20, 30], 20), 1)
    expect_equal(position([10, 20], 99), -1)
