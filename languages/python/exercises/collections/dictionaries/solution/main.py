"""Dictionary drills."""


def invert(mapping):
    """Return a new dictionary with keys and values swapped."""
    inverted = {}
    for key, value in mapping.items():
        inverted[value] = key
    return inverted


def count_letters(text):
    """Return a dictionary of letter to count, ignoring spaces."""
    counts = {}
    for letter in text:
        if letter == " ":
            continue
        counts[letter] = counts.get(letter, 0) + 1
    return counts


def add_score(scores, name, points):
    """Add points to name's score, starting from zero. Returns None."""
    scores[name] = scores.get(name, 0) + points
    return None


def busiest(counts):
    """Return the key with the largest value, or None if empty."""
    if not counts:
        return None
    return max(counts, key=counts.get)
