"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import countdown, every_other, numbered, pair_up


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_countdown():
    expect_equal(countdown(3), [3, 2, 1])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_every_other():
    expect_equal(every_other(["a", "b", "c", "d", "e"]), ["a", "c", "e"])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_numbered_starts_at_one():
    expect_equal(numbered(["apple", "pear"]), ["1. apple", "2. pear"])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_pair_up():
    expect_equal(pair_up(["a", "b"], [1, 2]), [("a", 1), ("b", 2)])
