# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""A ledger of account balances, in whole cents."""


class Ledger:
    """Tracks balances for named accounts."""

    def __init__(self):
        raise NotImplementedError

    def open_account(self, account_id, opening_balance=0):
        """Register a new account. ValueError if it exists or the balance is negative."""
        raise NotImplementedError

    def balance(self, account_id):
        """Return the current balance. KeyError if the account is unknown."""
        raise NotImplementedError

    def deposit(self, account_id, amount):
        """Add amount and return the new balance."""
        raise NotImplementedError

    def withdraw(self, account_id, amount):
        """Subtract amount and return the new balance."""
        raise NotImplementedError

    def accounts(self):
        """Return the account ids in the order they were opened."""
        raise NotImplementedError
