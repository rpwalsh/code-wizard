# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import InsufficientFunds, UnknownAccount, withdraw, withdraw_all


@pytest.mark.concept("python.errors.custom")
def test_a_successful_withdrawal():
    balances = {"a": 100}
    expect_equal(withdraw(balances, "a", 30), 70)
    expect_equal(balances["a"], 70)


@pytest.mark.concept("python.errors.custom")
def test_an_unknown_account():
    error = expect_raises(UnknownAccount, lambda: withdraw({}, "ghost", 1))
    expect_equal(error.account_id, "ghost")


@pytest.mark.concept("python.errors.custom")
def test_insufficient_funds_carries_the_numbers():
    error = expect_raises(InsufficientFunds, lambda: withdraw({"a": 10}, "a", 25))
    expect_equal(error.requested, 25)
    expect_equal(error.available, 10)
    expect_equal(error.shortfall, 15)


@pytest.mark.concept("python.errors.custom")
def test_withdraw_all_reports_every_failure():
    balances = {"a": 100, "b": 5}
    succeeded, failed = withdraw_all(balances, [("a", 10), ("b", 50), ("ghost", 1)])
    expect_equal(succeeded, 1)
    expect_equal(failed, [("b", "InsufficientFunds"), ("ghost", "UnknownAccount")])
