"""Grouping and aggregating transactions."""


def group_by_account(transactions):
    """Return {account_id: [transaction, ...]} preserving input order."""
    grouped = {}
    for transaction in transactions:
        grouped.setdefault(transaction["account"], []).append(transaction)
    return grouped


def balances(transactions):
    """Return {account_id: summed_amount}."""
    totals = {}
    for transaction in transactions:
        account = transaction["account"]
        totals[account] = totals.get(account, 0) + transaction["amount"]
    return totals


def busiest_account(transactions):
    """Return the account with the most transactions, or None if there are none."""
    grouped = group_by_account(transactions)
    if not grouped:
        return None
    # max keeps the first maximum it encounters, and dictionaries preserve
    # insertion order, so this is also the tie-break the prompt asks for.
    return max(grouped, key=lambda account: len(grouped[account]))
