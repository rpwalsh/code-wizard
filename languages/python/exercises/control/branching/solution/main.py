"""Branching drills."""


def grade(score):
    """Return "A", "B", "C" or "F"."""
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    return "F"


def describe(number):
    """Return "negative", "zero" or "positive"."""
    if number < 0:
        return "negative"
    if number == 0:
        return "zero"
    return "positive"


def first_long(words, minimum):
    """Return the first word longer than minimum, or None."""
    for word in words:
        if len(word) > minimum:
            return word
    return None


def count_matching(words, letter):
    """Return how many words start with letter."""
    total = 0
    for word in words:
        if word.startswith(letter):
            total = total + 1
    return total
