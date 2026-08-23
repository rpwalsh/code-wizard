# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""What annotations do and do not do."""

import pytest

from retrainer.expect import expect_equal
from main import describe_signature, initials, lookup, totals


@pytest.mark.concept("python.advanced.typing")
def test_every_function_is_annotated_including_its_return():
    for function in (initials, lookup, totals):
        expect_equal("return" in function.__annotations__, True)
        expect_equal(len(function.__annotations__) >= 2, True)


@pytest.mark.concept("python.advanced.typing")
def test_the_optional_return_is_declared():
    """Writing `-> int` and returning None anyway is a lie a checker catches
    and a reader does not."""
    expect_equal(str(lookup.__annotations__["return"]), "int | None")


@pytest.mark.concept("python.advanced.typing")
def test_the_collection_annotations_say_what_is_inside():
    expect_equal(str(initials.__annotations__["names"]), "list[str]")
    expect_equal(str(totals.__annotations__["rows"]), "list[dict[str, int]]")


@pytest.mark.concept("python.advanced.typing")
def test_annotations_are_not_enforced_at_runtime():
    """Passing the wrong type works and fails somewhere else later. That is
    the deal: they exist for readers and for tools that must be run."""
    expect_equal(lookup({"a": 1}, "a"), 1)
    expect_equal(initials([]), "")


@pytest.mark.concept("python.advanced.typing")
def test_the_empty_cases():
    expect_equal(totals([]), {})
    expect_equal(describe_signature(initials), ["list[str]"])
