import pytest

from forge_expect import expect_equal
from main import sweep_expired


def session(identifier, expires_at):
    return {"id": identifier, "expires_at": expires_at}


@pytest.mark.concept("python.control.for")
def test_long_run_of_expired_sessions():
    sessions = [session(str(i), i) for i in range(20)]
    removed = sweep_expired(sessions, 9)
    expect_equal(removed, [str(i) for i in range(10)])
    expect_equal([s["id"] for s in sessions], [str(i) for i in range(10, 20)])


@pytest.mark.concept("python.control.for")
def test_alternating_expiry():
    sessions = [session(str(i), 1 if i % 2 == 0 else 100) for i in range(10)]
    removed = sweep_expired(sessions, 10)
    expect_equal(removed, ["0", "2", "4", "6", "8"])
    expect_equal(len(sessions), 5)


@pytest.mark.concept("python.control.for")
def test_order_of_survivors_is_preserved():
    sessions = [session("keep1", 50), session("gone", 1), session("keep2", 60)]
    sweep_expired(sessions, 10)
    expect_equal([s["id"] for s in sessions], ["keep1", "keep2"])
