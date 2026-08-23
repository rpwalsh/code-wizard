# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Account balance lookups."""


def get_balance(accounts, account_id, default=0):
    """Return the balance for `account_id`, or `default` if it is unknown."""
    raise NotImplementedError


def total_balance(accounts, account_ids):
    """Return the summed balance of `account_ids`, ignoring unknown accounts."""
    raise NotImplementedError
