# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Dates, streams and a command line."""

import itertools
from datetime import date, timedelta


def days_between(first, last):
    """Whole days from the first date to the second. Earlier gives negative."""
    raise NotImplementedError


def add_days(date_text, days):
    """Return the date that many days on, as YYYY-MM-DD."""
    raise NotImplementedError


def runs(values):
    """Group consecutive equal values into (value, count) pairs."""
    raise NotImplementedError


def parse_arguments(argv):
    """Return (name, verbose). Bad usage raises SystemExit with a code."""
    raise NotImplementedError
