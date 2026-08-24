# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Grouping and counting, and the tie nobody notices until it moves."""

from __future__ import annotations

from typing import Callable, Hashable, Iterable, TypeVar

T = TypeVar("T")


def group_by(items: Iterable[T], key: Callable[[T], Hashable]) -> dict[Hashable, list[T]]:
    raise NotImplementedError


def count_by(items: Iterable[T], key: Callable[[T], Hashable]) -> dict[Hashable, int]:
    raise NotImplementedError


def top_n(counts: dict[Hashable, int], n: int) -> list[tuple[Hashable, int]]:
    raise NotImplementedError


def invert(mapping: dict[Hashable, Hashable]) -> dict[Hashable, list[Hashable]]:
    raise NotImplementedError
