"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import initials, label


@pytest.mark.concept("python.functions.arguments")
def test_initials_uses_only_the_first_letters():
    expect_equal(initials("Grace Hopper"), "G. H.")


@pytest.mark.concept("python.functions.arguments")
def test_label_with_zero_is_plural():
    """"0 files" is right and "0 file" is not, which the count == 1 check gets
    correct and a count > 1 check does not."""
    expect_equal(label(0, "file"), "0 files")


@pytest.mark.concept("python.functions.arguments")
def test_label_works_with_any_noun():
    expect_equal(label(2, "match"), "2 matchs")


@pytest.mark.concept("python.functions.arguments")
def test_label_arguments_are_used_in_the_right_order():
    expect_equal(label(5, "byte"), "5 bytes")
