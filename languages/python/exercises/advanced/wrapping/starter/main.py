# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Decorators that do not lie about the function they wrapped."""

from __future__ import annotations

from typing import Any, Callable


def counted(func: Callable[..., Any]) -> Callable[..., Any]:
    raise NotImplementedError


def memoized(func: Callable[..., Any]) -> Callable[..., Any]:
    raise NotImplementedError


def retried(attempts: int) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    raise NotImplementedError


def defaulted(value: Any) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    raise NotImplementedError
