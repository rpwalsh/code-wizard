# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import collecting, counted, counting_from, evens_up_to, first


@pytest.mark.concept("python.advanced.generators")
def test_a_generator_is_lazy_rather_than_a_list():
    produced = evens_up_to(4)
    expect_equal(isinstance(produced, list), False)
    expect_equal(list(produced), [0, 2])


@pytest.mark.concept("python.advanced.generators")
def test_first_stops_asking_once_it_has_enough():
    """A version that walks the whole input would run forever here, and one
    that takes count + 1 would pull a value it was not asked for."""
    asked = []

    def watched():
        for value in counting_from(0):
            asked.append(value)
            yield value

    expect_equal(first(watched(), 3), [0, 1, 2])
    expect_equal(asked, [0, 1, 2])


@pytest.mark.concept("python.advanced.generators")
def test_counting_from_a_negative():
    expect_equal(first(counting_from(-2), 4), [-2, -1, 0, 1])


@pytest.mark.concept("python.advanced.decorators")
def test_the_wrapper_passes_arguments_through():
    @counted
    def combine(a, b=10, *rest, **named):
        return (a, b, rest, named)

    expect_equal(combine(1), (1, 10, (), {}))
    expect_equal(combine(1, 2, 3, extra=4), (1, 2, (3,), {"extra": 4}))
    expect_equal(combine.calls, 2)


@pytest.mark.concept("python.advanced.decorators")
def test_the_wrapper_returns_what_the_function_returned():
    @counted
    def nothing():
        return None

    expect_equal(nothing(), None)
    expect_equal(nothing.calls, 1)


@pytest.mark.concept("python.advanced.context-managers")
def test_two_uses_do_not_share_a_record():
    with collecting() as first_record:
        first_record.append("a")
    with collecting() as second_record:
        pass
    expect_equal(second_record, ["entered", "cleaned"])
