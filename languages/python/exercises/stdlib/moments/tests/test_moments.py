# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases: parsing, converting, measuring and counting."""

from datetime import datetime, timedelta, timezone

import pytest

from retrainer.expect import expect_equal, expect_true
from main import hours_histogram, minutes_between, overlaps, parse_moment


@pytest.mark.concept("python.stdlib.datetime")
def test_a_trailing_z_parses_as_utc():
    moment = parse_moment("2026-03-14T09:30:00Z")
    expect_equal(moment.tzinfo, timezone.utc)
    expect_equal(moment.hour, 9)
    expect_equal(moment.minute, 30)


@pytest.mark.concept("python.stdlib.datetime")
def test_an_offset_is_converted_to_utc():
    """The same instant, written from Berlin. 11:30+02:00 is 09:30 UTC."""
    moment = parse_moment("2026-03-14T11:30:00+02:00")
    expect_equal(moment.hour, 9)
    expect_equal(moment.minute, 30)


@pytest.mark.concept("python.stdlib.datetime")
def test_two_spellings_of_one_instant_are_equal():
    expect_equal(
        parse_moment("2026-03-14T09:30:00Z"),
        parse_moment("2026-03-14T11:30:00+02:00"),
    )


@pytest.mark.concept("python.stdlib.datetime")
def test_minutes_between_counts_forward():
    start = parse_moment("2026-03-14T09:00:00Z")
    end = parse_moment("2026-03-14T10:30:00Z")
    expect_equal(minutes_between(start, end), 90)


@pytest.mark.concept("python.stdlib.datetime")
def test_minutes_between_counts_across_offsets():
    """Aware datetimes subtract correctly with no manual offset arithmetic."""
    start = parse_moment("2026-03-14T09:00:00Z")
    end = parse_moment("2026-03-14T12:30:00+02:00")
    expect_equal(minutes_between(start, end), 90)


@pytest.mark.concept("python.stdlib.datetime")
def test_overlapping_meetings_are_reported():
    nine = parse_moment("2026-03-14T09:00:00Z")
    ten = nine + timedelta(hours=1)
    half_nine = nine + timedelta(minutes=30)
    half_ten = ten + timedelta(minutes=30)

    expect_true(overlaps((nine, ten), (half_nine, half_ten)))


@pytest.mark.concept("python.stdlib.datetime")
def test_separate_meetings_do_not_overlap():
    nine = parse_moment("2026-03-14T09:00:00Z")
    ten = nine + timedelta(hours=1)
    eleven = nine + timedelta(hours=2)
    twelve = nine + timedelta(hours=3)

    expect_equal(overlaps((nine, ten), (eleven, twelve)), False)


@pytest.mark.concept("python.stdlib.datetime")
def test_histogram_counts_by_utc_hour():
    moments = [
        parse_moment("2026-03-14T09:05:00Z"),
        parse_moment("2026-03-14T09:55:00Z"),
        parse_moment("2026-03-14T11:00:00+02:00"),
        parse_moment("2026-03-14T14:00:00Z"),
    ]
    # The third is 09:00 UTC, so nine has three.
    expect_equal(hours_histogram(moments), {9: 3, 14: 1})


@pytest.mark.concept("python.errors.validation")
def test_a_timestamp_without_an_offset_is_refused():
    with pytest.raises(ValueError) as caught:
        parse_moment("2026-03-14T09:30:00")
    expect_true("no timezone" in str(caught.value))
