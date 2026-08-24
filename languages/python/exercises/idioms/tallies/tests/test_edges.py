# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The corners: ties, empties, and the dict that invents keys."""

import pytest

from retrainer.expect import expect_equal, expect_true
from main import count_by, group_by, invert, top_n


@pytest.mark.concept("python.stdlib.collections")
def test_a_tie_is_broken_by_the_key_not_by_insertion_order():
    """Counter.most_common leaves ties in insertion order.

    That is stable for one run and different the next time the same data
    arrives in another order, which makes a report that quietly disagrees
    with itself between two runs over the same week.
    """
    first = {"york": 3, "leeds": 3, "hull": 3}
    second = {"hull": 3, "leeds": 3, "york": 3}

    expect_equal(top_n(first, 3), [("hull", 3), ("leeds", 3), ("york", 3)])
    expect_equal(top_n(first, 3), top_n(second, 3))


@pytest.mark.concept("python.stdlib.collections")
def test_ranking_puts_the_larger_count_first_even_when_the_key_sorts_later():
    counts = {"a": 1, "z": 9}
    expect_equal(top_n(counts, 1), [("z", 9)])


@pytest.mark.concept("python.stdlib.collections")
def test_asking_for_none_returns_none():
    expect_equal(top_n({"a": 1}, 0), [])


@pytest.mark.concept("python.idioms.grouping")
def test_empty_input_produces_empty_results():
    expect_equal(group_by([], lambda item: item), {})
    expect_equal(count_by([], lambda item: item), {})
    expect_equal(top_n({}, 5), [])
    expect_equal(invert({}), {})


@pytest.mark.concept("python.idioms.grouping")
def test_the_result_does_not_invent_missing_keys():
    """A defaultdict handed back to a caller answers every lookup.

    That turns a typo into an empty group rather than a KeyError, and the
    report shows a city with no orders that does not exist.
    """
    groups = group_by([{"city": "leeds"}], lambda order: order["city"])

    with pytest.raises(KeyError):
        groups["ripon"]

    expect_equal("ripon" in groups, False)
    expect_equal(len(groups), 1)


@pytest.mark.concept("python.collections.dict")
def test_invert_keeps_every_key_that_shared_a_value():
    """Assuming one key per value drops every collision but the last."""
    inverted = invert({"a": 1, "b": 1, "c": 1})
    expect_equal(inverted, {1: ["a", "b", "c"]})


@pytest.mark.concept("python.collections.dict")
def test_invert_sorts_the_keys_it_collected():
    inverted = invert({"cy": "core", "ada": "core", "bo": "core"})
    expect_equal(inverted["core"], ["ada", "bo", "cy"])


@pytest.mark.concept("python.idioms.grouping")
def test_grouping_by_a_computed_key_works_the_same()  :
    items = [1, 2, 3, 4, 5, 6]
    groups = group_by(items, lambda value: "even" if value % 2 == 0 else "odd")
    expect_equal(groups["even"], [2, 4, 6])
    expect_equal(groups["odd"], [1, 3, 5])


@pytest.mark.concept("python.stdlib.collections")
def test_counting_distinguishes_values_of_different_types():
    counts = count_by([1, "1", 1], lambda value: value)
    expect_equal(counts[1], 2)
    expect_equal(counts["1"], 1)
    expect_true(len(counts) == 2)
