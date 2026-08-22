import pytest

from retrainer.expect import expect_equal, expect_raises
from main import Ledger


@pytest.mark.concept("python.modeling.state")
def test_history_cannot_be_rewritten_by_the_caller():
    book = Ledger()
    book.open_account("a", 100)
    book.deposit("a", 50)
    stolen = book.history("a")
    stolen.append({"kind": "deposit", "amount": 999999, "balance": 999999})
    expect_equal(len(book.history("a")), 1)


@pytest.mark.concept("python.modeling.state")
def test_two_ledgers_keep_separate_histories():
    first = Ledger()
    second = Ledger()
    first.open_account("a", 100)
    second.open_account("a", 100)
    first.deposit("a", 10)
    expect_equal(second.history("a"), [])


@pytest.mark.concept("python.modeling.state")
def test_a_long_chain_of_transfers():
    book = Ledger()
    for name in ["a", "b", "c"]:
        book.open_account(name, 300)
    for _ in range(30):
        book.transfer("a", "b", 5)
        book.transfer("b", "c", 5)
        book.transfer("c", "a", 5)
    expect_equal(book.balance("a"), 300)
    expect_equal(book.balance("b"), 300)
    expect_equal(book.balance("c"), 300)
    expect_equal(len(book.history("a")), 60)


@pytest.mark.concept("python.modeling.state")
def test_opening_an_account_records_nothing_even_with_a_balance():
    book = Ledger()
    book.open_account("a", 5000)
    expect_equal(book.history("a"), [])


@pytest.mark.concept("python.modeling.state")
def test_a_rejected_deposit_records_nothing():
    book = Ledger()
    book.open_account("a", 100)
    expect_raises(ValueError, lambda: book.deposit("a", -1))
    expect_equal(book.history("a"), [])
