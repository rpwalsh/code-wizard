"""The same behaviour as the JavaScript, on ordinary input."""

import pytest

from retrainer.expect import expect_equal
from main import active_names, by_newest, first_match, total_spend

USERS = [
    {"name": "Ada", "active": True},
    {"name": "Grace", "active": False},
    {"name": "Alan", "active": True},
]


@pytest.mark.concept("python.collections.comprehensions")
def test_filters_then_maps():
    expect_equal(active_names(USERS), ["Ada", "Alan"])


@pytest.mark.concept("python.idioms.aggregation")
def test_sums_amounts():
    expect_equal(total_spend([{"amount": 10}, {"amount": 5}]), 15)


@pytest.mark.concept("python.idioms.aggregation")
def test_no_orders_is_zero_not_an_error():
    expect_equal(total_spend([]), 0)


@pytest.mark.concept("python.idioms.sorting")
def test_sorts_newest_first():
    posts = [
        {"id": "a", "createdAt": 1},
        {"id": "b", "createdAt": 3},
        {"id": "c", "createdAt": 2},
    ]
    expect_equal([post["id"] for post in by_newest(posts)], ["b", "c", "a"])


@pytest.mark.concept("python.collections.comprehensions")
def test_finds_the_first_match():
    expect_equal(first_match([1, 2, 3], lambda value: value > 1), 2)


@pytest.mark.concept("python.collections.comprehensions")
def test_no_match_is_none():
    expect_equal(first_match([1, 2, 3], lambda value: value > 9), None)
