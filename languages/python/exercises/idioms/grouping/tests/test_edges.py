# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal
from main import balances, busiest_account, group_by_account


@pytest.mark.concept("python.idioms.grouping")
def test_no_transactions():
    expect_equal(group_by_account([]), {})
    expect_equal(balances([]), {})
    expect_equal(busiest_account([]), None)


@pytest.mark.concept("python.idioms.grouping")
def test_a_single_transaction():
    transactions = [{"account": "solo", "amount": 5, "kind": "deposit"}]
    expect_equal(balances(transactions), {"solo": 5})
    expect_equal(busiest_account(transactions), "solo")


@pytest.mark.concept("python.idioms.grouping")
def test_a_tie_goes_to_the_account_seen_first():
    transactions = [
        {"account": "second", "amount": 1, "kind": "deposit"},
        {"account": "first", "amount": 1, "kind": "deposit"},
    ]
    expect_equal(busiest_account(transactions), "second")


@pytest.mark.concept("python.idioms.grouping")
def test_amounts_can_cancel_out():
    transactions = [
        {"account": "a", "amount": 100, "kind": "deposit"},
        {"account": "a", "amount": -100, "kind": "withdrawal"},
    ]
    # A zero balance must still be reported, not dropped as falsy.
    expect_equal(balances(transactions), {"a": 0})
