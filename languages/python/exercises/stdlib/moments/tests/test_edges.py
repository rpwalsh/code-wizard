# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The corners: touching intervals, negative durations, and naive input."""

from datetime import datetime, timedelta, timezone

import pytest

from retrainer.expect import expect_equal, expect_true
from main import hours_histogram, minutes_between, overlaps, parse_moment


@pytest.mark.concept("python.stdlib.datetime")
def test_touching_meetings_do_not_overlap():
    """A meeting ending at ten and one starting at ten are back to back.

    If the interval included both ends, a calendar would refuse this
    perfectly ordinary booking.
    """
    nine = parse_moment("2026-03-14T09:00:00Z")
    ten = nine + timedelta(hours=1)
    eleven = nine + timedelta(hours=2)

    expect_equal(overlaps((nine, ten), (ten, eleven)), False)
    expect_equal(overlaps((ten, eleven), (nine, ten)), False)


@pytest.mark.concept("python.stdlib.datetime")
def test_one_meeting_wholly_inside_another_overlaps():
    nine = parse_moment("2026-03-14T09:00:00Z")
    noon = nine + timedelta(hours=3)
    ten = nine + timedelta(hours=1)
    eleven = nine + timedelta(hours=2)

    expect_true(overlaps((nine, noon), (ten, eleven)))
    expect_true(overlaps((ten, eleven), (nine, noon)))


@pytest.mark.concept("python.stdlib.datetime")
def test_an_empty_interval_overlaps_nothing():
    """Start equal to end is a zero-length interval and contains no instant."""
    ten = parse_moment("2026-03-14T10:00:00Z")
    nine = ten - timedelta(hours=1)
    eleven = ten + timedelta(hours=1)

    expect_equal(overlaps((ten, ten), (nine, eleven)), False)
    # And in the other position. Guarding only the first argument passes the
    # line above and is still wrong half the time.
    expect_equal(overlaps((nine, eleven), (ten, ten)), False)
    # Two empty intervals at the same instant share nothing either.
    expect_equal(overlaps((ten, ten), (ten, ten)), False)


@pytest.mark.concept("python.stdlib.datetime")
def test_a_negative_duration_truncates_toward_zero():
    """Floor division gets this wrong, and only on negatives.

    Ninety seconds backwards is minus one minute truncated, and minus two
    floored. The bug appears exactly when nobody is looking.
    """
    start = parse_moment("2026-03-14T09:01:30Z")
    end = parse_moment("2026-03-14T09:00:00Z")
    expect_equal(minutes_between(start, end), -1)


@pytest.mark.concept("python.stdlib.datetime")
def test_a_partial_minute_forward_truncates_too():
    start = parse_moment("2026-03-14T09:00:00Z")
    end = parse_moment("2026-03-14T09:01:30Z")
    expect_equal(minutes_between(start, end), 1)


@pytest.mark.concept("python.errors.validation")
def test_a_naive_datetime_is_refused_by_name():
    """Refused here, rather than raising Python's own TypeError later."""
    aware = parse_moment("2026-03-14T09:00:00Z")
    naive = datetime(2026, 3, 14, 10, 0, 0)

    with pytest.raises(ValueError) as caught:
        minutes_between(naive, aware)
    expect_true("naive" in str(caught.value))

    with pytest.raises(ValueError):
        minutes_between(aware, naive)


@pytest.mark.concept("python.errors.validation")
def test_the_refusal_names_the_offending_text():
    with pytest.raises(ValueError) as caught:
        parse_moment("2026-03-14T09:30:00")
    expect_true("2026-03-14T09:30:00" in str(caught.value))


@pytest.mark.concept("python.stdlib.datetime")
def test_an_empty_histogram_is_an_empty_dict():
    expect_equal(hours_histogram([]), {})


@pytest.mark.concept("python.stdlib.datetime")
def test_the_histogram_omits_hours_with_nothing_in_them():
    moments = [parse_moment("2026-03-14T00:30:00Z")]
    counts = hours_histogram(moments)
    expect_equal(counts, {0: 1})
    # Absent, not zero: a dict of every hour would be a different answer.
    expect_equal(1 in counts, False)


@pytest.mark.concept("python.stdlib.datetime")
def test_the_histogram_uses_utc_not_the_original_offset():
    """23:30+02:00 is 21:30 UTC, and the count belongs to hour 21."""
    moments = [parse_moment("2026-03-14T23:30:00+02:00")]
    expect_equal(hours_histogram(moments), {21: 1})
