# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Edge cases that catch the usual first attempt."""

import pytest

from retrainer.expect import expect_equal
from main import get_balance, total_balance


@pytest.mark.concept("python.collections.dict-lookup")
def test_a_zero_balance_is_not_treated_as_missing():
    # `accounts.get(id) or default` looks right and is wrong: 0 is falsy.
    expect_equal(get_balance({"acc-2": 0}, "acc-2", 99), 0)


@pytest.mark.concept("python.collections.dict-lookup")
def test_an_empty_ledger_still_answers():
    expect_equal(get_balance({}, "acc-1"), 0)


@pytest.mark.concept("python.collections.dict-lookup")
def test_an_empty_id_list_totals_zero():
    expect_equal(total_balance({"acc-1": 500}, []), 0)


@pytest.mark.concept("python.collections.dict-lookup")
def test_lookup_does_not_mutate_the_ledger():
    accounts = {"acc-1": 500}
    get_balance(accounts, "acc-404")
    total_balance(accounts, ["acc-404"])
    expect_equal(accounts, {"acc-1": 500})
