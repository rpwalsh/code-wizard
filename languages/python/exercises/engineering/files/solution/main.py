"""Files, paths and JSON."""

import json
from pathlib import Path


def _prepared(path):
    """The path, with its parent directory guaranteed to exist."""
    target = Path(path)
    if str(target.parent) not in ("", "."):
        target.parent.mkdir(parents=True, exist_ok=True)
    return target


def write_lines(path, lines):
    """Write each line followed by a newline, creating parent directories."""
    target = _prepared(path)
    with open(target, "w", encoding="utf-8") as handle:
        for line in lines:
            handle.write(line + "\n")


def read_lines(path):
    """Return the lines without trailing newlines. Missing file gives []."""
    target = Path(path)
    if not target.exists():
        return []
    with open(target, "r", encoding="utf-8") as handle:
        # splitlines, not split("\n"): a file ending in a newline would
        # otherwise produce a final empty piece that is not a line.
        return handle.read().splitlines()


def save_records(path, records):
    """Write a list of dictionaries as JSON."""
    with open(_prepared(path), "w", encoding="utf-8") as handle:
        json.dump(records, handle)


def load_records(path):
    """Read them back. Missing gives []; invalid JSON raises ValueError."""
    target = Path(path)
    if not target.exists():
        return []
    with open(target, "r", encoding="utf-8") as handle:
        return json.loads(handle.read())
