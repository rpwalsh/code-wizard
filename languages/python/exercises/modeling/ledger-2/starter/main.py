"""A ledger of account balances, in whole cents.

Stage 2: add transfer() and history(). Everything below already works and its
tests still run — change it only where you need to.
"""


class Ledger:
    """Tracks balances for named accounts."""

    def __init__(self):
        # Per-instance, not a class attribute: two ledgers must not share state.
        self._balances = {}

    def _require_account(self, account_id):
        """Raise KeyError unless the account exists."""
        if account_id not in self._balances:
            raise KeyError(account_id)

    @staticmethod
    def _require_positive(amount):
        if not isinstance(amount, int) or isinstance(amount, bool):
            raise ValueError("amount must be a whole number of cents")
        if amount <= 0:
            raise ValueError("amount must be positive")

    def open_account(self, account_id, opening_balance=0):
        """Register a new account. ValueError if it exists or the balance is negative."""
        if account_id in self._balances:
            raise ValueError("account already exists: " + str(account_id))
        if opening_balance < 0:
            raise ValueError("opening balance cannot be negative")
        self._balances[account_id] = opening_balance

    def balance(self, account_id):
        """Return the current balance. KeyError if the account is unknown."""
        self._require_account(account_id)
        return self._balances[account_id]

    def deposit(self, account_id, amount):
        """Add amount and return the new balance."""
        self._require_account(account_id)
        self._require_positive(amount)
        self._balances[account_id] += amount
        return self._balances[account_id]

    def withdraw(self, account_id, amount):
        """Subtract amount and return the new balance."""
        self._require_account(account_id)
        self._require_positive(amount)
        # Every check happens before the single mutation below, so a rejected
        # withdrawal cannot leave a partially applied change behind.
        if self._balances[account_id] < amount:
            raise ValueError("insufficient funds")
        self._balances[account_id] -= amount
        return self._balances[account_id]

    def accounts(self):
        """Return the account ids in the order they were opened."""
        return list(self._balances)

    def transfer(self, source, target, amount):
        """Move amount from source to target. Atomic: all of it, or none."""
        raise NotImplementedError

    def history(self, account_id):
        """Return the operations that affected this account, oldest first."""
        raise NotImplementedError
