"""Where equality would have been wrong."""

import pytest

from retrainer.expect import expect_close, expect_equal
from main import close_enough, normalise, settled


@pytest.mark.concept("python.numerical.floats")
def test_the_classic():
    """0.1 + 0.2 is 0.30000000000000004. Equality says these differ; the
    question was never whether they are identical."""
    expect_equal(0.1 + 0.2 == 0.3, False)
    expect_equal(close_enough(0.1 + 0.2, 0.3, 1e-9), True)


@pytest.mark.concept("python.numerical.floats")
def test_the_tolerance_boundary_is_inclusive():
    """Deliberately using values that are exact in binary. `abs(1.0 - 1.1)` is
    0.10000000000000009, which is not <= 0.1 — the boundary case is itself a
    victim of the thing this exercise is about."""
    expect_equal(close_enough(1.0, 1.5, 0.5), True)
    expect_equal(close_enough(1.0, 1.75, 0.5), False)


@pytest.mark.concept("python.numerical.floats")
def test_comparison_is_symmetric():
    expect_equal(close_enough(5.0, 4.0, 1.0), close_enough(4.0, 5.0, 1.0))


@pytest.mark.concept("python.numerical.vectors")
def test_normalising_a_zero_total_spreads_evenly():
    """Dividing by the total is obvious. Noticing the total can be zero is the
    part that separates code that works on your test data from code that works."""
    result = normalise({"a": 0, "b": 0})
    expect_close(result["a"], 0.5)
    expect_close(result["b"], 0.5)


@pytest.mark.concept("python.numerical.vectors")
def test_normalising_nothing():
    expect_equal(normalise({}), {})


@pytest.mark.concept("python.numerical.vectors")
def test_a_normalised_vector_sums_to_one():
    result = normalise({"a": 3, "b": 5, "c": 12})
    expect_close(sum(result.values()), 1.0)


@pytest.mark.concept("python.numerical.floats")
def test_settled_needs_every_key_to_have_settled():
    expect_equal(settled({"a": 1.0, "b": 1.0}, {"a": 1.0, "b": 9.0}, 1e-3), False)
