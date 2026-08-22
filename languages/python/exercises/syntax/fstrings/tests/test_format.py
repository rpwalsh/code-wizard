import pytest

from retrainer.expect import expect_equal
from main import describe, money


@pytest.mark.concept("python.syntax.strings")
def test_describes_a_person():
    expect_equal(describe("Ada", 36), "Ada is 36 years old")


@pytest.mark.concept("python.syntax.strings")
def test_formats_whole_dollars_with_two_decimals():
    expect_equal(money(1234), "$12.34")


@pytest.mark.concept("python.syntax.strings")
def test_keeps_the_trailing_zero():
    # 2.5 is wrong here; a price column has to line up.
    expect_equal(money(250), "$2.50")


@pytest.mark.concept("python.syntax.strings")
def test_pads_a_small_amount():
    expect_equal(money(5), "$0.05")
