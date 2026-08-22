"""Rejected operations must change nothing."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Ledger


@pytest.fixture
def ledger():
    book = Ledger()
    book.open_account("alice", 1000)
    return book


@pytest.mark.concept("python.errors.validation")
def test_cannot_open_the_same_account_twice(ledger):
    expect_raises(ValueError, lambda: ledger.open_account("alice"))
    expect_equal(ledger.balance("alice"), 1000)


@pytest.mark.concept("python.errors.validation")
def test_cannot_open_an_account_in_debt(ledger):
    expect_raises(ValueError, lambda: ledger.open_account("carol", -1))
    expect_equal(ledger.accounts(), ["alice"])


@pytest.mark.concept("python.errors.validation")
def test_amounts_must_be_positive(ledger):
    expect_raises(ValueError, lambda: ledger.deposit("alice", 0))
    expect_raises(ValueError, lambda: ledger.deposit("alice", -5))
    expect_raises(ValueError, lambda: ledger.withdraw("alice", 0))
    expect_raises(ValueError, lambda: ledger.withdraw("alice", -5))
    expect_equal(ledger.balance("alice"), 1000)


@pytest.mark.concept("python.errors.validation")
def test_overdraft_is_refused_and_changes_nothing(ledger):
    expect_raises(ValueError, lambda: ledger.withdraw("alice", 1001))
    expect_equal(ledger.balance("alice"), 1000)


@pytest.mark.concept("python.errors.validation")
def test_a_failed_deposit_on_an_unknown_account_creates_nothing(ledger):
    expect_raises(KeyError, lambda: ledger.deposit("ghost", 100))
    expect_equal(ledger.accounts(), ["alice"])


@pytest.mark.concept("python.errors.validation")
def test_the_smallest_legal_amount_is_one_cent(ledger):
    """A boundary worth pinning: "positive" starts at 1, not at 2."""
    ledger.deposit("alice", 1)
    expect_equal(ledger.balance("alice"), 1001)
    ledger.withdraw("alice", 1)
    expect_equal(ledger.balance("alice"), 1000)


@pytest.mark.concept("python.errors.validation")
def test_a_boolean_is_not_a_whole_number_of_cents(ledger):
    """`bool` is a subclass of `int` in Python, so `isinstance(True, int)` is
    True and a naive type check lets `deposit(account, True)` through as a
    one-cent deposit. The amount has to be a number someone meant to write."""
    expect_raises(ValueError, lambda: ledger.deposit("alice", True))
    expect_raises(ValueError, lambda: ledger.withdraw("alice", False))
    expect_equal(ledger.balance("alice"), 1000)
