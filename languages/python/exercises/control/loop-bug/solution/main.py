"""Session expiry."""


def sweep_expired(sessions, now):
    """Remove expired sessions in place and return the removed session ids."""
    removed = [session["id"] for session in sessions if session["expires_at"] <= now]
    # Slice assignment mutates the caller's list; a plain rebinding would not.
    sessions[:] = [session for session in sessions if session["expires_at"] > now]
    return removed
