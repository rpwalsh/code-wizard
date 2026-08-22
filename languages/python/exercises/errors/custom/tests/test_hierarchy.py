"""Catching one kind, and catching any kind."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import AccountError, InsufficientFunds, UnknownAccount, withdraw, withdraw_all


@pytest.mark.concept("python.errors.custom")
def test_the_base_catches_both():
    """A caller that does not care which problem occurred writes one except."""
    expect_raises(AccountError, lambda: withdraw({}, "ghost", 1))
    expect_raises(AccountError, lambda: withdraw({"a": 1}, "a", 5))


@pytest.mark.concept("python.errors.custom")
def test_the_specific_one_does_not_catch_the_other():
    caught = False
    try:
        withdraw({}, "ghost", 1)
    except InsufficientFunds:
        caught = True
    except UnknownAccount:
        caught = False
    expect_equal(caught, False)


@pytest.mark.concept("python.errors.custom")
def test_a_failed_withdrawal_changes_nothing():
    balances = {"a": 10}
    try:
        withdraw(balances, "a", 25)
    except InsufficientFunds:
        pass
    expect_equal(balances["a"], 10)


@pytest.mark.concept("python.errors.custom")
def test_withdrawing_the_exact_balance_is_allowed():
    """The boundary: equal is enough, only more is not."""
    expect_equal(withdraw({"a": 10}, "a", 10), 0)


@pytest.mark.concept("python.errors.custom")
def test_no_requests_at_all():
    expect_equal(withdraw_all({}, []), (0, []))


@pytest.mark.concept("python.errors.custom")
def test_withdraw_all_keeps_going_after_a_failure():
    """Letting the first exception escape reports one problem out of many."""
    balances = {"a": 100, "b": 100}
    succeeded, failed = withdraw_all(balances, [("ghost", 1), ("a", 1), ("b", 1)])
    expect_equal(succeeded, 2)
    expect_equal(len(failed), 1)
