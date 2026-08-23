# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import initials, label, safe_divide


@pytest.mark.concept("python.functions.definition")
def test_initials():
    expect_equal(initials("Alan Turing"), "A. T.")


@pytest.mark.concept("python.functions.definition")
def test_safe_divide():
    expect_equal(safe_divide(10, 2), 5.0)


@pytest.mark.concept("python.functions.definition")
def test_safe_divide_by_zero():
    expect_equal(safe_divide(10, 0), None)


@pytest.mark.concept("python.functions.definition")
def test_label():
    expect_equal(label(1, "file"), "1 file")
    expect_equal(label(3, "file"), "3 files")
