# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_close, expect_equal
from main import close_enough, normalize, settled, total_error


@pytest.mark.concept("python.numerical.floats")
def test_close_enough():
    expect_equal(close_enough(0.1 + 0.2, 0.3, 1e-9), True)
    expect_equal(close_enough(1.0, 1.5, 0.1), False)


@pytest.mark.concept("python.numerical.vectors")
def test_normalize():
    result = normalize({"a": 1, "b": 3})
    expect_close(result["a"], 0.25)
    expect_close(result["b"], 0.75)


@pytest.mark.concept("python.numerical.vectors")
def test_total_error():
    expect_close(total_error({"a": 1.0}, {"a": 1.5}), 0.5)


@pytest.mark.concept("python.numerical.floats")
def test_settled():
    expect_equal(settled({"a": 1.0}, {"a": 1.0000001}, 1e-3), True)
    expect_equal(settled({"a": 1.0}, {"a": 2.0}, 1e-3), False)
