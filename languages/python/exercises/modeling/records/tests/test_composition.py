# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""What the basket does not offer, and whose list is whose."""

import pytest

from retrainer.expect import expect_equal
from main import Basket, Point, merge


@pytest.mark.concept("python.modeling.composition")
def test_a_basket_is_not_a_list():
    """Inheriting from list would bring append, sort, pop and clear along,
    every one of which can put the object into a state its own methods never
    intended."""
    basket = Basket()
    expect_equal(isinstance(basket, list), False)
    expect_equal(hasattr(basket, "append"), False)
    expect_equal(hasattr(basket, "sort"), False)


@pytest.mark.concept("python.modeling.composition")
def test_two_baskets_do_not_share_a_list():
    """A plain mutable default would give every basket the same lines."""
    first = Basket()
    second = Basket()
    first.add("tea", 3)
    expect_equal(second.count(), 0)


@pytest.mark.concept("python.modeling.composition")
def test_merging_leaves_both_originals_alone():
    first = Basket()
    first.add("tea", 3)
    second = Basket()
    second.add("jam", 4)

    both = merge(first, second)
    both.add("bread", 2)

    expect_equal(first.count(), 1)
    expect_equal(second.count(), 1)
    expect_equal(both.count(), 3)


@pytest.mark.concept("python.modeling.composition")
def test_merging_keeps_the_order():
    first = Basket()
    first.add("a", 1)
    second = Basket()
    second.add("b", 2)
    expect_equal([name for name, _price in merge(first, second).lines], ["a", "b"])


@pytest.mark.concept("python.modeling.dataclasses")
def test_a_frozen_record_can_be_a_dictionary_key():
    """Equality and hashing are generated together, so neither goes stale."""
    counts = {Point(0, 0): 1}
    counts[Point(0, 0)] = counts[Point(0, 0)] + 1
    expect_equal(counts[Point(0, 0)], 2)
    expect_equal(len(counts), 1)


@pytest.mark.concept("python.modeling.composition")
def test_an_empty_basket_totals_zero():
    expect_equal(Basket().total(), 0)
    expect_equal(Basket().count(), 0)
