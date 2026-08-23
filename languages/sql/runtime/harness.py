# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The SQL test harness, driven by the sqlite3 module in Python's standard library.

Why Python: this platform already requires Python, and Python has bundled a
complete SQL engine since 2006. Shipping a separate database binary, or asking
a learner to install one before they can write a `SELECT`, would add a large
dependency to buy something already sitting on the machine.

Why SQLite specifically: it is the only engine that is present everywhere, needs
no server, no configuration and no account, and starts in a millisecond. The
cost is real and worth naming — SQLite's type affinity is looser than Postgres,
and it has no native `RIGHT JOIN` before 3.39 — so the curriculum stays on the
portable subset and says so where a dialect difference matters.

An exercise is three parts:

  schema.sql   the tables and their data, run before anything else
  main.sql     the learner's query, which is the thing under test
  tests/*.sql  expectations, as comment directives above each query

A test file looks like this:

    -- test: returns one row per customer
    -- concept: sql.sets.aggregates
    -- expect:
    -- a|30
    -- b|5
    SELECT customer, SUM(total) FROM orders GROUP BY customer ORDER BY customer;

Rows are compared as pipe-joined text, in order, after trailing whitespace is
stripped. Ordering is significant on purpose: a query whose result order is
unspecified is a query with a bug, and the exercises say `ORDER BY` when they
mean it.

Usage: python harness.py --report <path> <testFile>...
"""

from __future__ import annotations

import json
import re
import sqlite3
import sys
import time
from pathlib import Path

SCHEMA_FILE = "schema.sql"
SOLUTION_FILE = "main.sql"

# `-- key: value` at the start of a line, which is a comment to every SQL
# engine and a directive to us. Nothing here needs a parser.
DIRECTIVE = re.compile(r"^\s*--\s*(?P<key>test|concept|expect|uses)\s*:\s*(?P<value>.*)$")
CONTINUATION = re.compile(r"^\s*--\s?(?P<value>.*)$")


class Case:
    def __init__(self, name: str) -> None:
        self.name = name
        self.concept: str | None = None
        self.expected: list[str] = []
        self.sql: list[str] = []
        self.uses_solution = False
        self.line = 0

    @property
    def query(self) -> str:
        return "\n".join(self.sql).strip()


def parse(path: Path) -> tuple[list[Case], list[str]]:
    """Split a test file into cases. Returns the cases and any parse problems."""
    cases: list[Case] = []
    problems: list[str] = []
    current: Case | None = None
    collecting_expect = False

    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        directive = DIRECTIVE.match(raw)
        if directive:
            key = directive.group("key")
            value = directive.group("value").strip()

            if key == "test":
                current = Case(value)
                current.line = number
                cases.append(current)
                collecting_expect = False
            elif current is None:
                problems.append(f"{path}:{number}: '{key}' before any '-- test:'")
            elif key == "concept":
                current.concept = value
                collecting_expect = False
            elif key == "uses":
                current.uses_solution = value == SOLUTION_FILE
                collecting_expect = False
            elif key == "expect":
                collecting_expect = True
                if value:
                    current.expected.append(value)
            continue

        if collecting_expect:
            # An expectation block is consecutive comment lines under
            # `-- expect:`; the first line that is not a comment ends it.
            continuation = CONTINUATION.match(raw)
            if continuation is not None and raw.strip().startswith("--"):
                current.expected.append(continuation.group("value").rstrip())
                continue
            collecting_expect = False

        if current is not None and raw.strip():
            current.sql.append(raw)

    for case in cases:
        # A case marked `-- uses: main.sql` runs the learner's own query, so it
        # is not supposed to carry one of its own. Demanding a query here was a
        # bug that reported a passing exercise as a collection error.
        if not case.query and not case.uses_solution:
            problems.append(f"{path}: test '{case.name}' has no query")

    return cases, problems


def render(rows: list[tuple[object, ...]]) -> list[str]:
    """Rows as pipe-joined text, which is what the expectations are written in."""
    out = []
    for row in rows:
        out.append("|".join("" if value is None else str(value) for value in row))
    return out


def build_connection(root: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(":memory:")
    # Foreign keys are off by default in SQLite, which surprises everyone once.
    # An exercise about referential integrity must actually have it.
    connection.execute("PRAGMA foreign_keys = ON")

    schema = root / SCHEMA_FILE
    if schema.exists():
        connection.executescript(schema.read_text(encoding="utf-8"))
    return connection


def main(argv: list[str]) -> int:
    report_path = None
    files = []
    index = 0
    while index < len(argv):
        if argv[index] == "--report":
            report_path = argv[index + 1]
            index += 2
            continue
        files.append(argv[index])
        index += 1

    root = Path.cwd()
    solution = (root / SOLUTION_FILE).read_text(encoding="utf-8") if (root / SOLUTION_FILE).exists() else ""

    cases_out = []
    collection_errors = []

    for name in files:
        path = Path(name)
        if not path.exists():
            collection_errors.append({"path": name, "message": "no such test file"})
            continue

        try:
            parsed, problems = parse(path)
        except Exception as error:  # noqa: BLE001 - reported, not raised
            collection_errors.append({"path": name, "message": str(error)})
            continue

        for problem in problems:
            collection_errors.append({"path": name, "message": problem})

        for case in parsed:
            began = time.perf_counter()
            entry = {
                "id": f"{name}::{case.name}",
                "file": name,
                "name": case.name,
                "location": {"path": name, "line": case.line},
            }
            if case.concept:
                entry["concept"] = case.concept

            # A fresh database per case. Tests that share state pass or fail
            # depending on the order they happen to run in, which is the
            # single most common way a suite becomes untrustworthy.
            connection = build_connection(root)
            try:
                query = solution if case.uses_solution else case.query
                if case.uses_solution and not solution.strip():
                    raise ValueError(f"{SOLUTION_FILE} is empty")

                rows = connection.execute(query).fetchall()
                received = render(rows)
                expected = [line for line in case.expected]

                if received == expected:
                    entry["status"] = "passed"
                else:
                    entry["status"] = "failed"
                    entry["message"] = "the rows returned are not the rows expected"
                    entry["expected"] = "\n".join(expected)
                    entry["received"] = "\n".join(received)
            except sqlite3.Error as error:
                entry["status"] = "errored"
                entry["message"] = str(error)
                entry["exceptionType"] = type(error).__name__
            except Exception as error:  # noqa: BLE001 - a case error, not a crash
                entry["status"] = "errored"
                entry["message"] = str(error)
                entry["exceptionType"] = type(error).__name__
            finally:
                connection.close()

            entry["durationMs"] = round((time.perf_counter() - began) * 1000, 3)
            cases_out.append(entry)

    failed = any(case["status"] not in ("passed", "skipped") for case in cases_out)
    document = {
        "schema": 1,
        "exitStatus": 1 if failed or collection_errors else 0,
        "collectionErrors": collection_errors,
        "cases": cases_out,
    }

    if report_path:
        Path(report_path).write_text(json.dumps(document), encoding="utf-8")

    return document["exitStatus"]


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
