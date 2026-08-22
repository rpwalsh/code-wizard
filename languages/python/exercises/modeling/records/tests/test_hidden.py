"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import Basket, Point, merge, moved


@pytest.mark.concept("python.modeling.dataclasses")
def test_moving_by_nothing_and_by_negatives():
    expect_equal(moved(Point(5, 5), 0, 0), Point(5, 5))
    expect_equal(moved(Point(5, 5), -2, -3), Point(3, 2))


@pytest.mark.concept("python.modeling.dataclasses")
def test_moving_the_axes_independently():
    """Swapping dx and dy would pass a symmetric test and fail this one."""
    expect_equal(moved(Point(0, 0), 1, 2), Point(1, 2))


@pytest.mark.concept("python.modeling.composition")
def test_a_basket_built_with_lines_up_front():
    basket = Basket([("tea", 3)])
    expect_equal(basket.count(), 1)
    expect_equal(basket.total(), 3)


@pytest.mark.concept("python.modeling.composition")
def test_totals_with_fractional_prices():
    basket = Basket()
    basket.add("a", 1.5)
    basket.add("b", 2.25)
    expect_equal(basket.total(), 3.75)


@pytest.mark.concept("python.modeling.composition")
def test_merging_two_empty_baskets():
    expect_equal(merge(Basket(), Basket()).count(), 0)


@pytest.mark.concept("python.modeling.composition")
def test_merging_does_not_alias_the_source_lines():
    first = Basket()
    first.add("a", 1)
    both = merge(first, Basket())
    first.add("b", 2)
    expect_equal(both.count(), 1)
