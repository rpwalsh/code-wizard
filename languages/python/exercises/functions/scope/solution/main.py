# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Scope and closure drills."""


def make_adder(amount):
    """Return a function that adds amount to its argument."""

    def add(value):
        return value + amount

    return add


def apply_twice(function, value):
    """Return function(function(value))."""
    return function(function(value))


def counter():
    """Return a function returning 1, then 2, then 3, and so on."""
    count = 0

    def next_value():
        nonlocal count
        count = count + 1
        return count

    return next_value


def make_adders(amounts):
    """Return one adder function per amount."""
    return [lambda value, amount=amount: value + amount for amount in amounts]
