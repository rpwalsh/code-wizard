# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Account balance lookups."""


def get_balance(accounts, account_id, default=0):
    """Return the balance for `account_id`, or `default` if it is unknown."""
    return accounts.get(account_id, default)


def total_balance(accounts, account_ids):
    """Return the summed balance of `account_ids`, ignoring unknown accounts."""
    return sum(accounts.get(account_id, 0) for account_id in account_ids)
