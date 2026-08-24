# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases: grouping, counting, ranking and inverting."""

import pytest

from retrainer.expect import expect_equal
from main import count_by, group_by, invert, top_n

ORDERS = [
    {"city": "leeds", "total": 30},
    {"city": "york", "total": 12},
    {"city": "leeds", "total": 8},
    {"city": "hull", "total": 45},
    {"city": "york", "total": 5},
]


@pytest.mark.concept("python.idioms.grouping")
def test_group_by_collects_the_items():
    groups = group_by(ORDERS, lambda order: order["city"])
    expect_equal(sorted(groups), ["hull", "leeds", "york"])
    expect_equal([order["total"] for order in groups["leeds"]], [30, 8])


@pytest.mark.concept("python.idioms.grouping")
def test_group_by_keeps_input_order_inside_a_group():
    groups = group_by(ORDERS, lambda order: order["city"])
    expect_equal([order["total"] for order in groups["york"]], [12, 5])


@pytest.mark.concept("python.stdlib.collections")
def test_count_by_counts_the_items():
    expect_equal(
        count_by(ORDERS, lambda order: order["city"]),
        {"leeds": 2, "york": 2, "hull": 1},
    )


@pytest.mark.concept("python.stdlib.collections")
def test_top_n_ranks_by_count():
    counts = {"leeds": 5, "york": 9, "hull": 1}
    expect_equal(top_n(counts, 2), [("york", 9), ("leeds", 5)])


@pytest.mark.concept("python.stdlib.collections")
def test_top_n_returns_everything_when_n_is_large():
    counts = {"a": 2, "b": 1}
    expect_equal(top_n(counts, 10), [("a", 2), ("b", 1)])


@pytest.mark.concept("python.collections.dict")
def test_invert_maps_values_back_to_keys():
    expect_equal(
        invert({"ada": "core", "bo": "core", "cy": "infra"}),
        {"core": ["ada", "bo"], "infra": ["cy"]},
    )
