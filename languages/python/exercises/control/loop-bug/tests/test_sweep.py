# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal
from main import sweep_expired


def session(identifier, expires_at):
    return {"id": identifier, "expires_at": expires_at}


@pytest.mark.concept("python.control.for")
def test_removes_a_single_expired_session():
    sessions = [session("a", 5), session("b", 20)]
    expect_equal(sweep_expired(sessions, 10), ["a"])
    expect_equal([s["id"] for s in sessions], ["b"])


@pytest.mark.concept("python.control.for")
def test_removes_two_adjacent_expired_sessions():
    # The original loop skips "b": removing "a" shifts "b" into index 0,
    # which the loop counter has already moved past.
    sessions = [session("a", 1), session("b", 2), session("c", 30)]
    expect_equal(sweep_expired(sessions, 10), ["a", "b"])
    expect_equal([s["id"] for s in sessions], ["c"])


@pytest.mark.concept("python.control.for")
def test_expiry_is_inclusive():
    sessions = [session("a", 10)]
    expect_equal(sweep_expired(sessions, 10), ["a"])
    expect_equal(sessions, [])
