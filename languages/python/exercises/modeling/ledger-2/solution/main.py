# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""A ledger of account balances, in whole cents.

Stage 2: transfers and an audit trail, built on the stage 1 ledger.
"""


class Ledger:
    """Tracks balances for named accounts, and how each one got there."""

    def __init__(self):
        # Per-instance, not a class attribute: two ledgers must not share state.
        self._balances = {}
        self._history = {}

    # -- internals --------------------------------------------------------

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

    def _require_funds(self, account_id, amount):
        if self._balances[account_id] < amount:
            raise ValueError("insufficient funds")

    def _record(self, account_id, kind, amount, **extra):
        """Append one audit entry. Only ever called after a successful change."""
        entry = {"kind": kind, "amount": amount, "balance": self._balances[account_id]}
        entry.update(extra)
        self._history[account_id].append(entry)

    # -- public API -------------------------------------------------------

    def open_account(self, account_id, opening_balance=0):
        """Register a new account. ValueError if it exists or the balance is negative."""
        if account_id in self._balances:
            raise ValueError("account already exists: " + str(account_id))
        if opening_balance < 0:
            raise ValueError("opening balance cannot be negative")
        self._balances[account_id] = opening_balance
        self._history[account_id] = []

    def balance(self, account_id):
        """Return the current balance. KeyError if the account is unknown."""
        self._require_account(account_id)
        return self._balances[account_id]

    def deposit(self, account_id, amount):
        """Add amount and return the new balance."""
        self._require_account(account_id)
        self._require_positive(amount)
        self._balances[account_id] += amount
        self._record(account_id, "deposit", amount)
        return self._balances[account_id]

    def withdraw(self, account_id, amount):
        """Subtract amount and return the new balance."""
        self._require_account(account_id)
        self._require_positive(amount)
        self._require_funds(account_id, amount)
        self._balances[account_id] -= amount
        self._record(account_id, "withdrawal", amount)
        return self._balances[account_id]

    def transfer(self, source, target, amount):
        """Move amount from source to target. Atomic: all of it, or none."""
        # Everything that can refuse the transfer happens here, before any
        # balance changes. Past this point nothing can raise, so the ledger
        # cannot be left holding half a transfer.
        self._require_account(source)
        self._require_account(target)
        self._require_positive(amount)
        if source == target:
            raise ValueError("cannot transfer to the same account")
        self._require_funds(source, amount)

        self._balances[source] -= amount
        self._record(source, "transfer-out", amount, other=target)
        self._balances[target] += amount
        self._record(target, "transfer-in", amount, other=source)

    def history(self, account_id):
        """Return the operations that affected this account, oldest first."""
        self._require_account(account_id)
        # A copy: the caller must not be able to rewrite the audit trail.
        return list(self._history[account_id])

    def accounts(self):
        """Return the account ids in the order they were opened."""
        return list(self._balances)
