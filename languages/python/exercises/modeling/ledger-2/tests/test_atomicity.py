# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""A refused transfer must leave both accounts untouched."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Ledger


@pytest.fixture
def ledger():
    book = Ledger()
    book.open_account("alice", 1000)
    book.open_account("bob", 100)
    return book


def balances(book):
    return {account: book.balance(account) for account in book.accounts()}


@pytest.mark.concept("python.errors.exceptions")
def test_overdrawn_transfer_changes_neither_balance(ledger):
    before = balances(ledger)
    expect_raises(ValueError, lambda: ledger.transfer("bob", "alice", 5000))
    expect_equal(balances(ledger), before)


@pytest.mark.concept("python.errors.exceptions")
def test_unknown_target_does_not_debit_the_source(ledger):
    # The tempting implementation withdraws first and deposits second, which
    # loses the money entirely when the target turns out not to exist.
    expect_raises(KeyError, lambda: ledger.transfer("alice", "ghost", 250))
    expect_equal(ledger.balance("alice"), 1000)


@pytest.mark.concept("python.errors.exceptions")
def test_a_refused_transfer_records_no_history(ledger):
    expect_raises(ValueError, lambda: ledger.transfer("bob", "alice", 5000))
    expect_equal(ledger.history("bob"), [])
    expect_equal(ledger.history("alice"), [])


@pytest.mark.concept("python.errors.exceptions")
def test_self_transfer_records_no_history(ledger):
    expect_raises(ValueError, lambda: ledger.transfer("alice", "alice", 10))
    expect_equal(ledger.history("alice"), [])


@pytest.mark.concept("python.errors.exceptions")
def test_total_money_is_conserved_across_many_transfers(ledger):
    total_before = ledger.balance("alice") + ledger.balance("bob")
    for _ in range(50):
        ledger.transfer("alice", "bob", 10)
        ledger.transfer("bob", "alice", 7)
    expect_equal(ledger.balance("alice") + ledger.balance("bob"), total_before)


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
