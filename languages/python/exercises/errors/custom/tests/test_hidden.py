"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import AccountError, InsufficientFunds, UnknownAccount, withdraw, withdraw_all


@pytest.mark.concept("python.errors.custom")
def test_the_types_are_related_as_declared():
    expect_equal(issubclass(UnknownAccount, AccountError), True)
    expect_equal(issubclass(InsufficientFunds, AccountError), True)
    expect_equal(issubclass(AccountError, Exception), True)
    expect_equal(issubclass(UnknownAccount, InsufficientFunds), False)


@pytest.mark.concept("python.errors.custom")
def test_the_message_still_mentions_the_detail():
    error = expect_raises(UnknownAccount, lambda: withdraw({}, "missing", 1))
    expect_equal("missing" in str(error), True)


@pytest.mark.concept("python.errors.custom")
def test_shortfall_of_exactly_one():
    error = expect_raises(InsufficientFunds, lambda: withdraw({"a": 9}, "a", 10))
    expect_equal(error.shortfall, 1)


@pytest.mark.concept("python.errors.custom")
def test_withdrawing_from_a_zero_balance():
    expect_raises(InsufficientFunds, lambda: withdraw({"a": 0}, "a", 1))
    expect_equal(withdraw({"a": 0}, "a", 0), 0)


@pytest.mark.concept("python.errors.custom")
def test_successive_withdrawals_accumulate():
    balances = {"a": 100}
    withdraw(balances, "a", 30)
    withdraw(balances, "a", 20)
    expect_equal(balances["a"], 50)


@pytest.mark.concept("python.errors.custom")
def test_every_request_succeeding():
    balances = {"a": 100}
    expect_equal(withdraw_all(balances, [("a", 1), ("a", 2)]), (2, []))
    expect_equal(balances["a"], 97)
