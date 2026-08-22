"""Function drills."""


def initials(full_name):
    """Return "A. T." for "Alan Turing"."""
    first, last = full_name.split()
    return f"{first[0]}. {last[0]}."


def safe_divide(top, bottom):
    """Return top / bottom, or None when bottom is zero."""
    if bottom == 0:
        return None
    return top / bottom


def label(count, noun):
    """Return "1 file" or "3 files"."""
    if count == 1:
        return f"{count} {noun}"
    return f"{count} {noun}s"


def announce(message):
    """Print the message. Do not write a return statement."""
    print(message)
