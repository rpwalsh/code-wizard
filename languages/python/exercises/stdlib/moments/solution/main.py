# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Instants, offsets, and the difference between a clock and a moment."""

from __future__ import annotations

from datetime import datetime, timezone


def parse_moment(text: str) -> datetime:
    # fromisoformat did not understand a trailing Z before Python 3.11, so
    # the swap is what makes this work on the interpreters people have.
    normalized = text[:-1] + "+00:00" if text.endswith("Z") else text
    parsed = datetime.fromisoformat(normalized)

    # Refused at the boundary. Left alone it fails three functions later, on
    # a comparison, naming neither the field nor the file it came from.
    if parsed.tzinfo is None:
        raise ValueError(f"no timezone: {text}")

    return parsed.astimezone(timezone.utc)


def minutes_between(start: datetime, end: datetime) -> int:
    if start.tzinfo is None or end.tzinfo is None:
        raise ValueError("naive datetime")

    # Truncating toward zero. `//` floors, which turns minus ninety seconds
    # into minus two minutes — an off-by-one that only appears on negatives.
    return int((end - start).total_seconds() / 60)


def overlaps(
    first: tuple[datetime, datetime], second: tuple[datetime, datetime]
) -> bool:
    first_start, first_end = first
    second_start, second_end = second

    # An interval that does not advance holds no instants, so there is
    # nothing for it to share. The comparison below would say otherwise.
    if first_start >= first_end or second_start >= second_end:
        return False

    # Both comparisons strict, so intervals that merely touch are separate
    # and a back-to-back booking is allowed.
    return first_start < second_end and second_start < first_end


def hours_histogram(moments: list[datetime]) -> dict[int, int]:
    counts: dict[int, int] = {}
    for moment in moments:
        hour = moment.astimezone(timezone.utc).hour
        counts[hour] = counts.get(hour, 0) + 1
    return counts
