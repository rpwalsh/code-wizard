# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Ledger


@pytest.fixture
def ledger():
    book = Ledger()
    book.open_account("alice", 1000)
    book.open_account("bob", 100)
    return book


@pytest.mark.concept("python.modeling.state")
def test_moves_money_between_accounts(ledger):
    ledger.transfer("alice", "bob", 400)
    expect_equal(ledger.balance("alice"), 600)
    expect_equal(ledger.balance("bob"), 500)


@pytest.mark.concept("python.modeling.state")
def test_transfer_returns_nothing(ledger):
    expect_equal(ledger.transfer("alice", "bob", 1), None)


@pytest.mark.concept("python.modeling.state")
def test_can_transfer_the_whole_balance(ledger):
    ledger.transfer("alice", "bob", 1000)
    expect_equal(ledger.balance("alice"), 0)
    expect_equal(ledger.balance("bob"), 1100)


@pytest.mark.concept("python.modeling.state")
def test_unknown_accounts_are_rejected(ledger):
    expect_raises(KeyError, lambda: ledger.transfer("alice", "ghost", 10))
    expect_raises(KeyError, lambda: ledger.transfer("ghost", "alice", 10))


@pytest.mark.concept("python.modeling.state")
def test_self_transfer_is_rejected(ledger):
    expect_raises(ValueError, lambda: ledger.transfer("alice", "alice", 10))


@pytest.mark.concept("python.modeling.state")
def test_amount_must_be_positive(ledger):
    expect_raises(ValueError, lambda: ledger.transfer("alice", "bob", 0))
    expect_raises(ValueError, lambda: ledger.transfer("alice", "bob", -5))


@pytest.mark.concept("python.modeling.state")
def test_insufficient_funds_are_rejected(ledger):
    expect_raises(ValueError, lambda: ledger.transfer("bob", "alice", 101))
