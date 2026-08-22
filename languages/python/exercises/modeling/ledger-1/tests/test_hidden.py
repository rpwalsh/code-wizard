import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Ledger


@pytest.mark.concept("python.modeling.state")
def test_two_ledgers_do_not_share_state():
    first = Ledger()
    second = Ledger()
    first.open_account("shared", 100)
    expect_equal(second.accounts(), [])
    expect_raises(KeyError, lambda: second.balance("shared"))


@pytest.mark.concept("python.modeling.state")
def test_many_operations_stay_consistent():
    book = Ledger()
    book.open_account("a")
    for _ in range(500):
        book.deposit("a", 3)
    for _ in range(250):
        book.withdraw("a", 2)
    expect_equal(book.balance("a"), 1000)


@pytest.mark.concept("python.modeling.state")
def test_accounts_are_independent():
    book = Ledger()
    book.open_account("x", 100)
    book.open_account("y", 100)
    book.withdraw("x", 100)
    expect_equal(book.balance("y"), 100)


@pytest.mark.concept("python.modeling.state")
def test_non_string_account_ids_work():
    book = Ledger()
    book.open_account(7, 50)
    expect_equal(book.balance(7), 50)
    expect_equal(book.accounts(), [7])
