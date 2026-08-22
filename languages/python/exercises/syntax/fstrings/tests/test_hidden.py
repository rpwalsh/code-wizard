import pytest

from forge_expect import expect_equal
from main import describe, money


@pytest.mark.concept("python.syntax.strings")
def test_works_for_other_names():
    expect_equal(describe("Grace", 45), "Grace is 45 years old")
    expect_equal(describe("", 0), " is 0 years old")


@pytest.mark.concept("python.syntax.strings")
def test_rounds_rather_than_truncates():
    expect_equal(money(1), "$0.01")
    expect_equal(money(0), "$0.00")
    expect_equal(money(100000), "$1000.00")
