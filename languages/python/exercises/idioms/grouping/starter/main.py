# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Grouping and aggregating transactions."""


def group_by_account(transactions):
    """Return {account_id: [transaction, ...]} preserving input order."""
    raise NotImplementedError


def balances(transactions):
    """Return {account_id: summed_amount}."""
    raise NotImplementedError


def busiest_account(transactions):
    """Return the account with the most transactions, or None if there are none."""
    raise NotImplementedError
