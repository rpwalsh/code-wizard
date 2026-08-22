"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import apply_twice, counter, make_adder, make_adders


@pytest.mark.concept("python.functions.scope")
def test_adding_zero_and_negatives():
    expect_equal(make_adder(0)(5), 5)
    expect_equal(make_adder(-3)(5), 2)


@pytest.mark.concept("python.functions.scope")
def test_apply_twice_with_any_callable():
    expect_equal(apply_twice(abs, -5), 5)
    expect_equal(apply_twice(str.upper, "a"), "A")


@pytest.mark.concept("python.functions.scope")
def test_a_counter_keeps_going_past_ten():
    tick = counter()
    for _ in range(11):
        value = tick()
    expect_equal(value, 11)


@pytest.mark.concept("python.functions.scope")
def test_make_adders_returns_callables_not_values():
    adders = make_adders([5])
    expect_equal(callable(adders[0]), True)


@pytest.mark.concept("python.functions.scope")
def test_repeated_amounts_each_get_a_function():
    adders = make_adders([2, 2])
    expect_equal(len(adders), 2)
    expect_equal([adder(1) for adder in adders], [3, 3])
