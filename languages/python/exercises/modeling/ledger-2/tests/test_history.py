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
def test_a_new_account_has_no_history(ledger):
    expect_equal(ledger.history("alice"), [])


@pytest.mark.concept("python.modeling.state")
def test_records_a_deposit_with_the_resulting_balance(ledger):
    ledger.deposit("bob", 250)
    expect_equal(ledger.history("bob"), [{"kind": "deposit", "amount": 250, "balance": 350}])


@pytest.mark.concept("python.modeling.state")
def test_records_a_withdrawal(ledger):
    ledger.withdraw("alice", 400)
    expect_equal(
        ledger.history("alice"),
        [{"kind": "withdrawal", "amount": 400, "balance": 600}],
    )


@pytest.mark.concept("python.modeling.state")
def test_a_transfer_is_recorded_on_both_sides(ledger):
    ledger.transfer("alice", "bob", 250)
    expect_equal(
        ledger.history("alice"),
        [{"kind": "transfer-out", "amount": 250, "balance": 750, "other": "bob"}],
    )
    expect_equal(
        ledger.history("bob"),
        [{"kind": "transfer-in", "amount": 250, "balance": 350, "other": "alice"}],
    )


@pytest.mark.concept("python.modeling.state")
def test_history_is_oldest_first(ledger):
    ledger.deposit("alice", 100)
    ledger.withdraw("alice", 50)
    ledger.transfer("alice", "bob", 25)
    expect_equal(
        [entry["kind"] for entry in ledger.history("alice")],
        ["deposit", "withdrawal", "transfer-out"],
    )
    expect_equal([entry["balance"] for entry in ledger.history("alice")], [1100, 1050, 1025])


@pytest.mark.concept("python.modeling.state")
def test_history_of_an_unknown_account_raises(ledger):
    expect_raises(KeyError, lambda: ledger.history("ghost"))
