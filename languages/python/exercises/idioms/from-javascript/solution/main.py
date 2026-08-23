# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Translated from JavaScript."""


def active_names(users):
    """Return the names of active users, in order."""
    return [user["name"] for user in users if user["active"]]


def total_spend(orders):
    """Return the sum of every order amount. No orders means 0."""
    return sum(order["amount"] for order in orders)


def by_newest(posts):
    """Return the posts sorted by createdAt, newest first."""
    return sorted(posts, key=lambda post: post["createdAt"], reverse=True)


def first_match(items, predicate):
    """Return the first item satisfying predicate, or None."""
    for item in items:
        if predicate(item):
            return item
    return None
