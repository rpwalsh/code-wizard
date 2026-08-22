import pytest

from retrainer.expect import expect_equal
from main import get_balance, total_balance

ACCOUNTS = {"acc-1": 1200, "acc-2": 0, "acc-3": -450}


@pytest.mark.concept("python.collections.dict-lookup")
def test_returns_an_existing_balance():
    expect_equal(get_balance(ACCOUNTS, "acc-1"), 1200)


@pytest.mark.concept("python.collections.dict-lookup")
def test_returns_zero_for_an_unknown_account():
    expect_equal(get_balance(ACCOUNTS, "acc-404"), 0)


@pytest.mark.concept("python.collections.dict-lookup")
def test_returns_a_supplied_default():
    expect_equal(get_balance(ACCOUNTS, "acc-404", -1), -1)


@pytest.mark.concept("python.collections.dict-lookup")
def test_totals_known_accounts():
    expect_equal(total_balance(ACCOUNTS, ["acc-1", "acc-3"]), 750)


@pytest.mark.concept("python.collections.dict-lookup")
def test_skips_unknown_accounts_in_a_total():
    expect_equal(total_balance(ACCOUNTS, ["acc-1", "acc-404"]), 1200)
