import pytest

from forge_expect import expect_equal
from main import balances, busiest_account, group_by_account

TRANSACTIONS = [
    {"account": "a", "amount": 1000, "kind": "deposit"},
    {"account": "b", "amount": 250, "kind": "deposit"},
    {"account": "a", "amount": -400, "kind": "withdrawal"},
    {"account": "a", "amount": 50, "kind": "interest"},
]


@pytest.mark.concept("python.idioms.grouping")
def test_groups_every_account():
    grouped = group_by_account(TRANSACTIONS)
    expect_equal(sorted(grouped), ["a", "b"])
    expect_equal(len(grouped["a"]), 3)
    expect_equal(len(grouped["b"]), 1)


@pytest.mark.concept("python.idioms.grouping")
def test_preserves_order_within_a_group():
    grouped = group_by_account(TRANSACTIONS)
    expect_equal([t["kind"] for t in grouped["a"]], ["deposit", "withdrawal", "interest"])


@pytest.mark.concept("python.idioms.grouping")
def test_sums_each_account():
    expect_equal(balances(TRANSACTIONS), {"a": 650, "b": 250})


@pytest.mark.concept("python.idioms.grouping")
def test_finds_the_busiest_account():
    expect_equal(busiest_account(TRANSACTIONS), "a")
