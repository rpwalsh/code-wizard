"""Reshaping a list of user records."""


def active_names(users):
    """Return the names of active users, in order."""
    return [user["name"] for user in users if user["active"]]


def email_index(users):
    """Return {email: name} for active users."""
    return {user["email"]: user["name"] for user in users if user["active"]}


def domains(users):
    """Return the set of email domains belonging to active users."""
    return {user["email"].split("@")[-1] for user in users if user["active"]}
