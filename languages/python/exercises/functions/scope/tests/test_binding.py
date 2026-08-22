"""When the captured value is looked up."""

import pytest

from retrainer.expect import expect_equal
from main import counter, make_adder, make_adders


@pytest.mark.concept("python.functions.scope")
def test_every_adder_keeps_its_own_amount():
    """A closure captures the variable, not its value. Built carelessly, every
    function looks up `amount` after the loop has finished, so all of them use
    the last one — all agreeing, all wrong."""
    adders = make_adders([1, 2, 3])
    expect_equal([adder(0) for adder in adders], [1, 2, 3])


@pytest.mark.concept("python.functions.scope")
def test_two_counters_do_not_share_a_count():
    """Each call to counter() must start its own state, which a module-level
    variable would not."""
    first = counter()
    second = counter()
    expect_equal(first(), 1)
    expect_equal(first(), 2)
    expect_equal(second(), 1)


@pytest.mark.concept("python.functions.scope")
def test_two_adders_do_not_share_an_amount():
    expect_equal(make_adder(1)(0), 1)
    expect_equal(make_adder(100)(0), 100)


@pytest.mark.concept("python.functions.scope")
def test_no_adders_is_an_empty_list():
    expect_equal(make_adders([]), [])
