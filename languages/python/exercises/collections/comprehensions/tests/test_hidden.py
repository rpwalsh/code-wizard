# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal
from main import active_names, domains, email_index


@pytest.mark.concept("python.collections.comprehensions")
def test_many_domains():
    users = [
        {"name": "A", "email": "a@one.com", "active": True},
        {"name": "B", "email": "b@two.com", "active": True},
        {"name": "C", "email": "c@one.com", "active": True},
        {"name": "D", "email": "d@three.com", "active": False},
    ]
    expect_equal(domains(users), {"one.com", "two.com"})
    expect_equal(active_names(users), ["A", "B", "C"])


@pytest.mark.concept("python.collections.comprehensions")
def test_a_later_user_wins_a_duplicate_email():
    users = [
        {"name": "First", "email": "same@x.com", "active": True},
        {"name": "Second", "email": "same@x.com", "active": True},
    ]
    expect_equal(email_index(users), {"same@x.com": "Second"})


@pytest.mark.concept("python.collections.comprehensions")
def test_does_not_mutate_the_input():
    users = [{"name": "A", "email": "a@one.com", "active": True}]
    active_names(users)
    email_index(users)
    domains(users)
    expect_equal(users, [{"name": "A", "email": "a@one.com", "active": True}])
