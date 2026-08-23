# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal
from main import balances, busiest_account, group_by_account


@pytest.mark.concept("python.idioms.grouping")
def test_many_accounts():
    transactions = [
        {"account": "acc-" + str(i % 7), "amount": i, "kind": "deposit"} for i in range(70)
    ]
    grouped = group_by_account(transactions)
    expect_equal(len(grouped), 7)
    expect_equal(all(len(group) == 10 for group in grouped.values()), True)
    expect_equal(busiest_account(transactions), "acc-0")


@pytest.mark.concept("python.idioms.grouping")
def test_grouped_values_are_the_original_dictionaries():
    transaction = {"account": "a", "amount": 1, "kind": "deposit"}
    grouped = group_by_account([transaction])
    expect_equal(grouped["a"][0] is transaction, True)


@pytest.mark.concept("python.idioms.grouping")
def test_balances_are_independent_of_grouping():
    transactions = [
        {"account": "x", "amount": -5, "kind": "fee"},
        {"account": "y", "amount": 10, "kind": "deposit"},
        {"account": "x", "amount": -5, "kind": "fee"},
    ]
    expect_equal(balances(transactions), {"x": -10, "y": 10})
