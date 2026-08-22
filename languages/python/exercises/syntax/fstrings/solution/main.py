"""String formatting drills."""


def describe(name, age):
    """Return "<name> is <age> years old"."""
    return f"{name} is {age} years old"


def money(cents):
    """Return a dollar amount with two decimal places, e.g. "$12.34"."""
    return f"${cents / 100:.2f}"
