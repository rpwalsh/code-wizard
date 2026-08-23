# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Signature drills."""


def join_words(*words, separator=" "):
    """Join any number of words with a separator, defaulting to a space."""
    return separator.join(words)


def tag(name, **attributes):
    """Build an opening tag from a name and any number of named attributes."""
    if not attributes:
        return "<" + name + ">"
    rendered = " ".join(f'{key}="{value}"' for key, value in attributes.items())
    return "<" + name + " " + rendered + ">"


def collect(item, into=None):
    """Append item to a list, starting a new one when none is given."""
    if into is None:
        into = []
    into.append(item)
    return into
