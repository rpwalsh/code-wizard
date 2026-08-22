import pytest

from forge_expect import expect_equal
from main import sweep_expired


def session(identifier, expires_at):
    return {"id": identifier, "expires_at": expires_at}


@pytest.mark.concept("python.control.for")
def test_nothing_to_do():
    sessions = [session("a", 100)]
    expect_equal(sweep_expired(sessions, 10), [])
    expect_equal(len(sessions), 1)


@pytest.mark.concept("python.control.for")
def test_empty_input():
    sessions = []
    expect_equal(sweep_expired(sessions, 10), [])
    expect_equal(sessions, [])


@pytest.mark.concept("python.control.for")
def test_everything_expires():
    sessions = [session("a", 1), session("b", 2), session("c", 3)]
    expect_equal(sweep_expired(sessions, 10), ["a", "b", "c"])
    expect_equal(sessions, [])


@pytest.mark.concept("python.control.for")
def test_mutates_the_callers_list_rather_than_a_copy():
    sessions = [session("a", 1), session("b", 100)]
    held_by_caller = sessions
    sweep_expired(sessions, 10)
    expect_equal(len(held_by_caller), 1, message="the caller's list must be updated in place")
