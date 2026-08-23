# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import all_tags, city_of, deep_copy_grid, group_by_city


@pytest.mark.concept("python.collections.nested")
def test_an_empty_tag_list():
    expect_equal(all_tags([{"tags": []}]), [])


@pytest.mark.concept("python.collections.nested")
def test_grouping_one_person():
    expect_equal(group_by_city([{"name": "Ada", "city": "Oslo"}]), {"Oslo": ["Ada"]})


@pytest.mark.concept("python.collections.nested")
def test_grouping_nothing():
    expect_equal(group_by_city([]), {})


@pytest.mark.concept("python.collections.nested")
def test_grouping_keeps_duplicates_within_a_city():
    people = [{"name": "Ada", "city": "Oslo"}, {"name": "Ada", "city": "Oslo"}]
    expect_equal(group_by_city(people), {"Oslo": ["Ada", "Ada"]})


@pytest.mark.concept("python.collections.nested")
def test_city_present_but_None():
    expect_equal(city_of({"address": {"city": None}}), None)


@pytest.mark.concept("python.collections.nested")
def test_the_outer_list_is_also_new():
    original = [[1]]
    expect_equal(deep_copy_grid(original) is original, False)
