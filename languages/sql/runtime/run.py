# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Run one query and print what it returns.

This is what "Run" means for SQL. Every other language in the platform executes
a program and shows its output; here the equivalent is executing the query the
learner is writing and showing the rows — which is the thing they actually want
to look at while writing it.

The schema is applied first, in a fresh in-memory database, so pressing Run
twice gives the same answer twice. A database that accumulates state between
runs is a database where the third run disagrees with the first for reasons
nobody can see.

Output is a plain aligned table rather than the pipe-joined form the tests
compare. The tests need something exact and machine-checkable; a person reading
their own result needs column names and alignment.

Usage: python run.py <queryFile>
"""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

SCHEMA_FILE = "schema.sql"
MAX_ROWS = 200


def main(argv: list[str]) -> int:
    if not argv:
        print("run.py: no query file given", file=sys.stderr)
        return 2

    query_path = Path(argv[0])
    if not query_path.exists():
        print(f"run.py: {query_path} does not exist", file=sys.stderr)
        return 2

    query = query_path.read_text(encoding="utf-8").strip()
    if not query:
        print(f"{query_path} is empty — write a query and run it again.")
        return 0

    connection = sqlite3.connect(":memory:")
    connection.execute("PRAGMA foreign_keys = ON")

    schema = Path(SCHEMA_FILE)
    if schema.exists():
        connection.executescript(schema.read_text(encoding="utf-8"))

    try:
        cursor = connection.execute(query)
    except sqlite3.Error as error:
        # The engine's own message, unchanged. It names the token it choked on,
        # which is more useful than anything a wrapper could add.
        print(f"{type(error).__name__}: {error}", file=sys.stderr)
        return 1

    if cursor.description is None:
        # A statement that returns no rows still did something worth reporting.
        connection.commit()
        print(f"{cursor.rowcount} row(s) affected.")
        return 0

    headers = [column[0] for column in cursor.description]
    rows = cursor.fetchmany(MAX_ROWS + 1)
    truncated = len(rows) > MAX_ROWS
    rows = rows[:MAX_ROWS]

    cells = [[render(value) for value in row] for row in rows]
    widths = [len(header) for header in headers]
    for row in cells:
        for index, value in enumerate(row):
            widths[index] = max(widths[index], len(value))

    print("  ".join(header.ljust(widths[index]) for index, header in enumerate(headers)).rstrip())
    print("  ".join("-" * width for width in widths))
    for row in cells:
        print("  ".join(value.ljust(widths[index]) for index, value in enumerate(row)).rstrip())

    print()
    print(f"{len(rows)} row(s)" + (f", showing the first {MAX_ROWS}" if truncated else ""))
    return 0


def render(value: object) -> str:
    # NULL is not the empty string and the difference is most of what goes
    # wrong in SQL, so it is shown as itself.
    return "NULL" if value is None else str(value)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
