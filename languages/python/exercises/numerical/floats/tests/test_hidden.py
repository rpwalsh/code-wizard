"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_close, expect_equal
from main import close_enough, normalise, settled, total_error


@pytest.mark.concept("python.numerical.vectors")
def test_normalising_a_single_key():
    expect_close(normalise({"only": 7})["only"], 1.0)


@pytest.mark.concept("python.numerical.vectors")
def test_normalising_is_proportional():
    doubled = normalise({"a": 2, "b": 4})
    plain = normalise({"a": 1, "b": 2})
    expect_close(doubled["a"], plain["a"])


@pytest.mark.concept("python.numerical.vectors")
def test_total_error_of_identical_vectors_is_zero():
    expect_close(total_error({"a": 1.0, "b": 2.0}, {"a": 1.0, "b": 2.0}), 0.0)


@pytest.mark.concept("python.numerical.vectors")
def test_total_error_adds_up_across_keys():
    expect_close(total_error({"a": 1.0, "b": 5.0}, {"a": 2.0, "b": 3.0}), 3.0)


@pytest.mark.concept("python.numerical.floats")
def test_error_is_absolute_not_signed():
    """Signed differences would cancel and report a settled vector that moved."""
    expect_close(total_error({"a": 0.0, "b": 2.0}, {"a": 1.0, "b": 1.0}), 2.0)


@pytest.mark.concept("python.numerical.floats")
def test_settled_on_an_empty_vector():
    expect_equal(settled({}, {}, 1e-9), True)


@pytest.mark.concept("python.numerical.floats")
def test_a_zero_tolerance_demands_exactness():
    expect_equal(close_enough(1.0, 1.0, 0.0), True)
    expect_equal(close_enough(0.1 + 0.2, 0.3, 0.0), False)
