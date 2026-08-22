"""Records and composition."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Point:
    """A point that cannot change."""

    x: int
    y: int


def moved(point, dx, dy):
    """Return a new Point shifted by the offsets."""
    raise NotImplementedError


@dataclass
class Basket:
    """Holds lines of (name, price). Holds a list; is not one."""

    lines: list = field(default_factory=list)

    def add(self, name, price):
        """Append a line."""
        raise NotImplementedError

    def total(self):
        """Sum of the prices."""
        raise NotImplementedError

    def count(self):
        """Number of lines."""
        raise NotImplementedError


def merge(first, second):
    """Return a new Basket with the lines of both, in order."""
    raise NotImplementedError
