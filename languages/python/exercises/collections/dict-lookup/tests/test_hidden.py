"""Hidden tests: these exist so the exercise cannot be passed by hardcoding."""

import pytest

from forge_expect import expect_equal
from main import get_balance, total_balance


@pytest.mark.concept("python.collections.dict-lookup")
def test_works_for_an_unrelated_ledger():
    ledger = {"x": 7, "y": 11, "z": 13}
    expect_equal(get_balance(ledger, "y"), 11)
    expect_equal(get_balance(ledger, "q", 5), 5)


@pytest.mark.concept("python.collections.dict-lookup")
def test_repeated_ids_are_counted_each_time():
    expect_equal(total_balance({"a": 10}, ["a", "a", "a"]), 30)


@pytest.mark.concept("python.collections.dict-lookup")
def test_integer_keys_work_too():
    expect_equal(get_balance({1: 100, 2: 200}, 2), 200)
    expect_equal(total_balance({1: 100, 2: 200}, [1, 2, 3]), 300)
