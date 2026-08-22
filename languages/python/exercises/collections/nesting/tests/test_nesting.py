"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import all_tags, city_of, deep_copy_grid, group_by_city


@pytest.mark.concept("python.collections.nested")
def test_city_of():
    expect_equal(city_of({"address": {"city": "Oslo"}}), "Oslo")


@pytest.mark.concept("python.collections.nested")
def test_all_tags():
    posts = [{"tags": ["b", "a"]}, {"tags": ["a", "c"]}]
    expect_equal(all_tags(posts), ["a", "b", "c"])


@pytest.mark.concept("python.collections.nested")
def test_group_by_city():
    people = [
        {"name": "Ada", "city": "Oslo"},
        {"name": "Alan", "city": "Bath"},
        {"name": "Grace", "city": "Oslo"},
    ]
    expect_equal(group_by_city(people), {"Oslo": ["Ada", "Grace"], "Bath": ["Alan"]})


@pytest.mark.concept("python.collections.nested")
def test_deep_copy_grid():
    expect_equal(deep_copy_grid([[1, 2], [3]]), [[1, 2], [3]])
