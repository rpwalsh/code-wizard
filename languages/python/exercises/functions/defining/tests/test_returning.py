# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""What comes back when you did not say."""

import io
import contextlib

import pytest

from retrainer.expect import expect_equal
from main import announce, safe_divide


@pytest.mark.concept("python.functions.definition")
def test_a_function_without_a_return_gives_None():
    """Not nothing, not zero. That is why a forgotten return surfaces as a
    TypeError about NoneType two functions away from the one that is wrong."""
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        result = announce("hello")

    expect_equal(result, None)
    expect_equal(captured.getvalue().strip(), "hello")


@pytest.mark.concept("python.functions.definition")
def test_the_printing_function_returns_nothing_usable():
    """A function that prints its answer has thrown the answer away."""
    with contextlib.redirect_stdout(io.StringIO()):
        expect_equal(announce("x") is None, True)


@pytest.mark.concept("python.functions.definition")
def test_zero_on_top_is_fine():
    """Only the divisor is a problem. Guarding both would be wrong."""
    expect_equal(safe_divide(0, 5), 0.0)


@pytest.mark.concept("python.functions.definition")
def test_negative_divisor_is_not_the_guarded_case():
    expect_equal(safe_divide(10, -2), -5.0)
