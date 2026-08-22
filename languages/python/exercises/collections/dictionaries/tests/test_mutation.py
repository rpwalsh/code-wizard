"""What changes, and what comes back."""

import pytest

from retrainer.expect import expect_equal
from main import add_score, busiest, invert


@pytest.mark.concept("python.collections.dict-mutation")
def test_add_score_changes_the_caller_dictionary():
    scores = {"ada": 10}
    add_score(scores, "ada", 5)
    expect_equal(scores, {"ada": 15})


@pytest.mark.concept("python.collections.dict-mutation")
def test_add_score_starts_a_new_name_from_zero():
    scores = {}
    add_score(scores, "new", 3)
    expect_equal(scores, {"new": 3})


@pytest.mark.concept("python.collections.dict-mutation")
def test_add_score_returns_nothing():
    """The mutating methods are inconsistent about return values, so a function
    ending `return scores.update(...)` returns None and looks like it worked."""
    expect_equal(add_score({}, "a", 1), None)


@pytest.mark.concept("python.collections.dict")
def test_invert_does_not_disturb_the_original():
    original = {"a": 1}
    invert(original)
    expect_equal(original, {"a": 1})


@pytest.mark.concept("python.collections.dict")
def test_busiest_of_nothing_is_None():
    expect_equal(busiest({}), None)
