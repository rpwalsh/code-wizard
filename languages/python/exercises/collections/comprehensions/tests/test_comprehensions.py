# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import pytest

from retrainer.expect import expect_equal
from main import active_names, domains, email_index

USERS = [
    {"name": "Ada", "email": "ada@example.com", "active": True},
    {"name": "Bob", "email": "bob@other.org", "active": False},
    {"name": "Cy", "email": "cy@example.com", "active": True},
]


@pytest.mark.concept("python.collections.comprehensions")
def test_keeps_only_active_users():
    expect_equal(active_names(USERS), ["Ada", "Cy"])


@pytest.mark.concept("python.collections.comprehensions")
def test_indexes_active_users_by_email():
    expect_equal(email_index(USERS), {"ada@example.com": "Ada", "cy@example.com": "Cy"})


@pytest.mark.concept("python.collections.comprehensions")
def test_collects_distinct_domains():
    expect_equal(domains(USERS), {"example.com"})
