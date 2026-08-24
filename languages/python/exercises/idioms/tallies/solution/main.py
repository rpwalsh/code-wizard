# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Grouping and counting, and the tie nobody notices until it moves."""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Callable, Hashable, Iterable, TypeVar

T = TypeVar("T")


def group_by(items: Iterable[T], key: Callable[[T], Hashable]) -> dict[Hashable, list[T]]:
    groups: defaultdict[Hashable, list[T]] = defaultdict(list)
    for item in items:
        groups[key(item)].append(item)
    # Returned as a plain dict: a defaultdict handed to a caller invents a
    # key on the first lookup of one that is missing, which turns a typo
    # into an empty group instead of a KeyError.
    return dict(groups)


def count_by(items: Iterable[T], key: Callable[[T], Hashable]) -> dict[Hashable, int]:
    return dict(Counter(key(item) for item in items))


def top_n(counts: dict[Hashable, int], n: int) -> list[tuple[Hashable, int]]:
    # Counter.most_common leaves ties in insertion order, which is stable
    # for one run and different the next time the input arrives in another
    # order. Sorting on the key as well makes the answer a fact about the
    # data rather than about the order it was read in.
    ordered = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
    return ordered[:n]


def invert(mapping: dict[Hashable, Hashable]) -> dict[Hashable, list[Hashable]]:
    # Many keys can share a value, so the inverse maps to a list. Assuming
    # otherwise silently drops every collision but the last.
    inverted: defaultdict[Hashable, list[Hashable]] = defaultdict(list)
    for key, value in mapping.items():
        inverted[value].append(key)
    return {value: sorted(keys) for value, keys in inverted.items()}
