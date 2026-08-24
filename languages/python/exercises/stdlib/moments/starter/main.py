# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Instants, offsets, and the difference between a clock and a moment."""

from __future__ import annotations

from datetime import datetime


def parse_moment(text: str) -> datetime:
    raise NotImplementedError


def minutes_between(start: datetime, end: datetime) -> int:
    raise NotImplementedError


def overlaps(
    first: tuple[datetime, datetime], second: tuple[datetime, datetime]
) -> bool:
    raise NotImplementedError


def hours_histogram(moments: list[datetime]) -> dict[int, int]:
    raise NotImplementedError
