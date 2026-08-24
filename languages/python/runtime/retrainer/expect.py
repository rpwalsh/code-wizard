# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Assertion helpers that carry structured expectation data.

Plain ``assert`` works fine in Code Wizard exercises, but pytest can only hand the
reporter a rendered string. These helpers raise an exception that carries the
expected and received values as separate fields, so the test panel can show

    Expected:
    False

    Received:
    KeyError: "account-42"

instead of a wall of traceback (spec section 12).
"""

from __future__ import annotations

import reprlib
from typing import Any, Callable, NoReturn

__all__ = [
    "ExpectationError",
    "expect_equal",
    "expect_true",
    "expect_false",
    "expect_raises",
    "expect_close",
]

_repr = reprlib.Repr()
_repr.maxstring = 240
_repr.maxother = 240
_repr.maxlist = 20
_repr.maxdict = 20


class ExpectationError(AssertionError):
    """An assertion failure with machine-readable expectation data."""

    def __init__(
        self,
        message: str | None,
        *,
        summary: str,
        expected: str | None = None,
        received: str | None = None,
        concept: str | None = None,
    ) -> None:
        # `summary` is what a plain traceback shows; `message` is the note the
        # author wrote. Keeping them apart lets the test panel stay quiet when
        # the author had nothing to add beyond the expected/received pair.
        super().__init__(message or summary)
        self.retrainer_message = message
        self.retrainer_expected = expected
        self.retrainer_received = received
        self.retrainer_concept = concept


def _render(value: Any) -> str:
    try:
        return _repr.repr(value)
    except Exception:  # pragma: no cover - repr of a hostile object
        return f"<unrepresentable {type(value).__name__}>"


def _fail(
    message: str | None,
    summary: str,
    expected: str | None,
    received: str | None,
    concept: str | None,
) -> NoReturn:
    raise ExpectationError(
        message,
        summary=summary,
        expected=expected,
        received=received,
        concept=concept,
    )


def expect_equal(
    received: Any, expected: Any, *, message: str | None = None, concept: str | None = None
) -> None:
    """Assert ``received == expected``, reporting both sides separately."""
    if received == expected:
        return
    _fail(message, "values are not equal", _render(expected), _render(received), concept)


def expect_true(
    received: Any, *, message: str | None = None, concept: str | None = None
) -> None:
    if received:
        return
    _fail(message, "expected a truthy value", "truthy", _render(received), concept)


def expect_false(
    received: Any, *, message: str | None = None, concept: str | None = None
) -> None:
    if not received:
        return
    _fail(message, "expected a falsy value", "falsy", _render(received), concept)


def expect_close(
    received: float,
    expected: float,
    *,
    tolerance: float = 1e-9,
    message: str | None = None,
    concept: str | None = None,
) -> None:
    if abs(received - expected) <= tolerance:
        return
    _fail(
        message,
        f"values differ by more than {tolerance}",
        _render(expected),
        _render(received),
        concept,
    )


def expect_raises(
    exception: type[BaseException] | tuple[type[BaseException], ...],
    call: Callable[[], Any],
    *,
    message: str | None = None,
    concept: str | None = None,
) -> BaseException:
    """Assert that ``call()`` raises ``exception`` and return the instance."""
    names = (
        exception.__name__
        if isinstance(exception, type)
        else ", ".join(item.__name__ for item in exception)
    )
    try:
        result = call()
    except exception as error:  # noqa: B902 - the whole point of the helper
        return error
    except BaseException as error:  # noqa: B902
        _fail(
            message,
            f"expected {names}",
            f"{names} to be raised",
            f"{type(error).__name__}: {error}",
            concept,
        )
    _fail(
        message,
        f"expected {names}",
        f"{names} to be raised",
        f"returned {_render(result)} without raising",
        concept,
    )
