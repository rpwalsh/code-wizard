# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Dates, streams and a command line."""

import itertools
from datetime import date, timedelta


def days_between(first, last):
    """Whole days from the first date to the second. Earlier gives negative."""
    return (date.fromisoformat(last) - date.fromisoformat(first)).days


def add_days(date_text, days):
    """Return the date that many days on, as YYYY-MM-DD."""
    return (date.fromisoformat(date_text) + timedelta(days=days)).isoformat()


def runs(values):
    """Group consecutive equal values into (value, count) pairs."""
    return [(value, len(list(group))) for value, group in itertools.groupby(values)]


def parse_arguments(argv):
    """Return (name, verbose). Bad usage raises SystemExit with a code."""
    name = None
    verbose = False
    index = 0
    while index < len(argv):
        argument = argv[index]
        if argument == "--verbose":
            verbose = True
            index = index + 1
        elif argument == "--name":
            if index + 1 >= len(argv):
                raise SystemExit(2)
            name = argv[index + 1]
            index = index + 2
        else:
            raise SystemExit(2)
    if name is None:
        raise SystemExit(2)
    return name, verbose
