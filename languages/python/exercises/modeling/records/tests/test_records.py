"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Basket, Point, merge, moved


@pytest.mark.concept("python.modeling.dataclasses")
def test_a_point_has_a_generated_constructor_and_equality():
    expect_equal(Point(1, 2), Point(1, 2))
    expect_equal(Point(1, 2) == Point(2, 1), False)


@pytest.mark.concept("python.modeling.dataclasses")
def test_moved_returns_a_new_point():
    start = Point(1, 2)
    expect_equal(moved(start, 3, 4), Point(4, 6))
    expect_equal(start, Point(1, 2))


@pytest.mark.concept("python.modeling.dataclasses")
def test_a_frozen_point_refuses_assignment():
    point = Point(1, 2)
    expect_raises(Exception, lambda: setattr(point, "x", 99))


@pytest.mark.concept("python.modeling.composition")
def test_a_basket_adds_and_totals():
    basket = Basket()
    basket.add("tea", 3)
    basket.add("jam", 4)
    expect_equal(basket.total(), 7)
    expect_equal(basket.count(), 2)
