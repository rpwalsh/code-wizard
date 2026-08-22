"""Where fewest-edges and cheapest come apart."""

import pytest

from retrainer.expect import expect_equal
from main import cheapest, count_regions, has_cycle, ordering


@pytest.mark.concept("python.algorithms.shortest-path")
def test_the_cheapest_route_is_not_the_shortest_one():
    """Breadth-first search would take the single direct edge and report 10.
    Two cheap edges beat one expensive one, which is the whole reason
    weights need a different algorithm."""
    graph = {"a": [("c", 10), ("b", 1)], "b": [("c", 1)], "c": []}
    expect_equal(cheapest(graph, "a", "c"), 2)


@pytest.mark.concept("python.algorithms.shortest-path")
def test_an_unreachable_goal():
    expect_equal(cheapest({"a": [], "b": []}, "a", "b"), None)


@pytest.mark.concept("python.algorithms.shortest-path")
def test_the_route_to_yourself_costs_nothing():
    expect_equal(cheapest({"a": [("b", 3)], "b": []}, "a", "a"), 0)


@pytest.mark.concept("python.algorithms.shortest-path")
def test_a_cheaper_route_found_later_wins():
    """The expensive entry is already in the heap when the cheap one is found.
    It cannot be removed, so it must be recognised and skipped."""
    graph = {
        "a": [("b", 100), ("c", 1)],
        "c": [("d", 1)],
        "d": [("b", 1)],
        "b": [],
    }
    expect_equal(cheapest(graph, "a", "b"), 3)


@pytest.mark.concept("python.algorithms.topological")
def test_no_regions_at_all():
    expect_equal(count_regions([]), 0)
    expect_equal(count_regions(["..", ".."]), 0)


@pytest.mark.concept("python.algorithms.topological")
def test_a_region_that_needs_every_direction():
    """Scanning row by row, a flood fill that only goes down and right finds
    these as several regions instead of one. Each shape below forces a
    different direction to be present."""
    expect_equal(count_regions([".#", "##"]), 1)
    expect_equal(count_regions(["#.", "##"]), 1)
    expect_equal(count_regions(["##", "#."]), 1)
    expect_equal(count_regions(["##", ".#"]), 1)
    # A cup: from the top-left cell the only route to the top-right one goes
    # down, along, and back up.
    expect_equal(count_regions(["#.#", "###"]), 1)
    expect_equal(count_regions(["###", "#.#"]), 1)
    # Straight lines against an edge, so no diagonal step can stand in for
    # the cardinal one.
    expect_equal(count_regions([".#", ".#"]), 1)
    expect_equal(count_regions(["#.", "#."]), 1)
    # A tall cup. The right arm is reachable only by going straight up against
    # the edge, where no diagonal step can substitute.
    expect_equal(count_regions(["#.#", "#.#", "###"]), 1)


@pytest.mark.concept("python.algorithms.topological")
def test_a_region_two_cells_apart_is_two_regions():
    """A step of two would join these. They are not neighbours."""
    expect_equal(count_regions(["#.#"]), 2)
    expect_equal(count_regions(["#", ".", "#"]), 2)


@pytest.mark.concept("python.algorithms.topological")
def test_cells_touching_only_at_a_corner_are_separate():
    """Diagonal neighbours do not connect, so this is two regions."""
    expect_equal(count_regions(["#.", ".#"]), 2)


@pytest.mark.concept("python.algorithms.topological")
def test_an_ordering_with_no_edges_is_alphabetical():
    expect_equal(ordering({"c": [], "a": [], "b": []}), ["a", "b", "c"])
    expect_equal(has_cycle({"a": [], "b": []}), False)
