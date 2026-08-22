"""Files, paths and JSON."""

import json
from pathlib import Path


def write_lines(path, lines):
    """Write each line followed by a newline, creating parent directories."""
    raise NotImplementedError


def read_lines(path):
    """Return the lines without trailing newlines. Missing file gives []."""
    raise NotImplementedError


def save_records(path, records):
    """Write a list of dictionaries as JSON."""
    raise NotImplementedError


def load_records(path):
    """Read them back. Missing gives []; invalid JSON raises ValueError."""
    raise NotImplementedError
