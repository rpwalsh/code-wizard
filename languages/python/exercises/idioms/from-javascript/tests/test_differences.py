# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Where the two languages genuinely disagree."""

import pytest

from retrainer.expect import expect_equal
from main import active_names, by_newest


@pytest.mark.concept("python.idioms.sorting")
def test_sorting_does_not_disturb_the_original():
    """JavaScript's sort mutates, which is why the original spread the array
    first. Python's sorted returns a new list, so the copy is unnecessary --
    but list.sort() would mutate, and this catches that translation."""
    posts = [{"id": "a", "createdAt": 1}, {"id": "b", "createdAt": 2}]
    by_newest(posts)
    expect_equal([post["id"] for post in posts], ["a", "b"])


@pytest.mark.concept("python.idioms.sorting")
def test_sorting_returns_a_list_rather_than_none():
    """list.sort() returns None. Returning it is the classic first attempt."""
    result = by_newest([{"id": "a", "createdAt": 1}])
    expect_equal(result, [{"id": "a", "createdAt": 1}])


@pytest.mark.concept("python.collections.comprehensions")
def test_nothing_active_is_an_empty_list():
    expect_equal(active_names([{"name": "Ada", "active": False}]), [])


@pytest.mark.concept("python.collections.comprehensions")
def test_active_is_read_as_a_flag_not_as_truthiness_of_the_name():
    expect_equal(active_names([{"name": "", "active": True}]), [""])
