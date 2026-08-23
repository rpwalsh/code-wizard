# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Exception types of your own."""


class AccountError(Exception):
    """Base for anything that can go wrong with an account."""


class UnknownAccount(AccountError):
    """No such account. Carries account_id."""

    def __init__(self, account_id):
        super().__init__(f"unknown account: {account_id}")
        self.account_id = account_id


class InsufficientFunds(AccountError):
    """Not enough money. Carries requested and available."""

    def __init__(self, requested, available):
        super().__init__(f"requested {requested}, available {available}")
        self.requested = requested
        self.available = available

    @property
    def shortfall(self):
        """How much was missing."""
        return self.requested - self.available


def withdraw(balances, account_id, amount):
    """Return the new balance, or raise the appropriate AccountError."""
    if account_id not in balances:
        raise UnknownAccount(account_id)
    available = balances[account_id]
    if amount > available:
        raise InsufficientFunds(amount, available)
    balances[account_id] = available - amount
    return balances[account_id]


def withdraw_all(balances, requests):
    """Return (succeeded, failed). Does not stop at the first failure."""
    succeeded = 0
    failed = []
    for account_id, amount in requests:
        try:
            withdraw(balances, account_id, amount)
        except AccountError as error:
            failed.append((account_id, type(error).__name__))
        else:
            succeeded = succeeded + 1
    return succeeded, failed
