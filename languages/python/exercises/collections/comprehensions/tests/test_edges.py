# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal
from main import active_names, domains, email_index


@pytest.mark.concept("python.collections.comprehensions")
def test_no_users_at_all():
    expect_equal(active_names([]), [])
    expect_equal(email_index([]), {})
    expect_equal(domains([]), set())


@pytest.mark.concept("python.collections.comprehensions")
def test_nobody_is_active():
    users = [{"name": "Bob", "email": "bob@other.org", "active": False}]
    expect_equal(active_names(users), [])
    expect_equal(domains(users), set())


@pytest.mark.concept("python.collections.comprehensions")
def test_returns_a_set_not_a_list():
    users = [{"name": "Ada", "email": "ada@example.com", "active": True}]
    result = domains(users)
    expect_equal(isinstance(result, set), True, message="domains must return a set")


@pytest.mark.concept("python.collections.comprehensions")
def test_order_is_preserved():
    users = [
        {"name": "Zoe", "email": "zoe@a.com", "active": True},
        {"name": "Al", "email": "al@a.com", "active": True},
    ]
    expect_equal(active_names(users), ["Zoe", "Al"])
