"""Exception types of your own."""


class AccountError(Exception):
    """Base for anything that can go wrong with an account."""


class UnknownAccount(AccountError):
    """No such account. Carries account_id."""


class InsufficientFunds(AccountError):
    """Not enough money. Carries requested and available."""


def withdraw(balances, account_id, amount):
    """Return the new balance, or raise the appropriate AccountError."""
    raise NotImplementedError


def withdraw_all(balances, requests):
    """Return (succeeded, failed). Does not stop at the first failure."""
    raise NotImplementedError
