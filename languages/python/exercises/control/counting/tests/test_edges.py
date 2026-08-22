"""Where the ends are, and what gets dropped."""

import pytest

from retrainer.expect import expect_equal
from main import countdown, every_other, pair_up


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_countdown_reaches_one_and_stops():
    """A range stops before its end value, which is why counting down to 1
    means giving 0 as the stop."""
    expect_equal(countdown(1), [1])
    expect_equal(countdown(0), [])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_zip_stops_at_the_shorter_and_says_nothing():
    """Two lists that should have matched quietly produce a short result
    rather than an error. Worth meeting here rather than in real data."""
    expect_equal(pair_up(["a", "b", "c"], [1]), [("a", 1)])
    expect_equal(pair_up([], [1, 2]), [])


@pytest.mark.concept("python.control.range-enumerate-zip")
def test_every_other_of_an_odd_length():
    expect_equal(every_other(["a", "b", "c"]), ["a", "c"])
    expect_equal(every_other([]), [])
