import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Ledger


@pytest.fixture
def ledger():
    book = Ledger()
    book.open_account("alice", 1000)
    book.open_account("bob")
    return book


@pytest.mark.concept("python.modeling.state")
def test_opens_accounts_with_and_without_an_opening_balance(ledger):
    expect_equal(ledger.balance("alice"), 1000)
    expect_equal(ledger.balance("bob"), 0)


@pytest.mark.concept("python.modeling.state")
def test_lists_accounts_in_the_order_they_were_opened(ledger):
    expect_equal(ledger.accounts(), ["alice", "bob"])


@pytest.mark.concept("python.modeling.state")
def test_deposit_returns_the_new_balance(ledger):
    expect_equal(ledger.deposit("bob", 250), 250)
    expect_equal(ledger.balance("bob"), 250)


@pytest.mark.concept("python.modeling.state")
def test_withdraw_returns_the_new_balance(ledger):
    expect_equal(ledger.withdraw("alice", 400), 600)
    expect_equal(ledger.balance("alice"), 600)


@pytest.mark.concept("python.modeling.state")
def test_withdrawing_the_whole_balance_is_allowed(ledger):
    expect_equal(ledger.withdraw("alice", 1000), 0)


@pytest.mark.concept("python.modeling.state")
def test_unknown_accounts_raise_key_error(ledger):
    expect_raises(KeyError, lambda: ledger.balance("nobody"))
    expect_raises(KeyError, lambda: ledger.deposit("nobody", 10))
    expect_raises(KeyError, lambda: ledger.withdraw("nobody", 10))
