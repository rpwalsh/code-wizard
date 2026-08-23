# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Records and composition."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Point:
    """A point that cannot change."""

    x: int
    y: int


def moved(point, dx, dy):
    """Return a new Point shifted by the offsets."""
    return Point(point.x + dx, point.y + dy)


@dataclass
class Basket:
    """Holds lines of (name, price). Holds a list; is not one."""

    # A plain `= []` here would give every basket the same list. The language
    # refuses it, which is one of the few places it stops the mistake.
    lines: list = field(default_factory=list)

    def add(self, name, price):
        """Append a line."""
        self.lines.append((name, price))

    def total(self):
        """Sum of the prices."""
        return sum(price for _name, price in self.lines)

    def count(self):
        """Number of lines."""
        return len(self.lines)


def merge(first, second):
    """Return a new Basket with the lines of both, in order."""
    return Basket(list(first.lines) + list(second.lines))
