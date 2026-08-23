# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Session expiry."""


def sweep_expired(sessions, now):
    """Remove expired sessions in place and return the removed session ids."""
    removed = []
    for index in range(len(sessions)):
        if index >= len(sessions):
            break
        session = sessions[index]
        if session["expires_at"] <= now:
            removed.append(session["id"])
            sessions.pop(index)
    return removed
