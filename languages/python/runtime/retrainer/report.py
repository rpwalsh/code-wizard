# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""pytest plugin that emits a structured JSON report for Code Wizard.

Parsing human-readable pytest output is brittle and version-dependent, so the
runtime adapter never does it. This plugin writes one JSON document describing
every test case, which the TypeScript side reads directly.

Loaded explicitly with ``-p retrainer.report``; the runtime puts this directory on
PYTHONPATH. Only stable, non-wrapper hooks are used so the plugin keeps working
across pytest majors.
"""

from __future__ import annotations

import json
import os
from typing import Any

import pytest

_REPORT_OPTION = "--retrainer-report"


def pytest_addoption(parser: pytest.Parser) -> None:
    group = parser.getgroup("retrainer", "Structured test reporting")
    group.addoption(
        _REPORT_OPTION,
        action="store",
        dest="report_path",
        default=None,
        metavar="PATH",
        help="Write a structured JSON report of the run to PATH.",
    )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "concept(name): the skill this test probes, shown when it fails.",
    )
    path = config.getoption("report_path", default=None)
    if path:
        config.pluginmanager.register(Reporter(path), "retrainer-reporter")


def _normalize(value: str) -> str:
    return value.replace(os.sep, "/").replace("\\", "/")


def _split_nodeid(nodeid: str) -> tuple[str, str]:
    normalized = _normalize(nodeid)
    file_path, _, remainder = normalized.partition("::")
    return file_path, remainder or file_path


class Reporter:
    """Collects per-test outcomes and writes them once the session ends."""

    def __init__(self, path: str) -> None:
        self._path = path
        self._cases: dict[str, dict[str, Any]] = {}
        self._order: list[str] = []
        self._collection_errors: list[dict[str, str]] = []
        self._concepts: dict[str, str] = {}

    # -- collection ---------------------------------------------------------

    def pytest_collectreport(self, report: pytest.CollectReport) -> None:
        if not report.failed:
            return
        self._collection_errors.append(
            {
                "path": _normalize(str(report.nodeid)),
                "message": _shorten(_longrepr_text(report)),
            }
        )

    # -- execution ----------------------------------------------------------

    def pytest_runtest_logreport(self, report: pytest.TestReport) -> None:
        record = self._touch(report.nodeid, report.location)
        record["durationMs"] += int(report.duration * 1000)

        if report.failed:
            # A failure outside the call phase is an error, not a failed
            # assertion: the learner's code never got to be judged.
            record["status"] = "failed" if report.when == "call" else "errored"
            # The rendered traceback is the fallback. When the assertion
            # already told us what was expected and what arrived, repeating it
            # as a stack trace only adds noise.
            if "expected" not in record and "received" not in record:
                record.setdefault("message", _shorten(_longrepr_text(report)))
        elif report.skipped and record["status"] == "passed":
            record["status"] = "skipped"
            record.setdefault("message", _shorten(_longrepr_text(report)))

    def pytest_exception_interact(
        self,
        node: Any,
        call: pytest.CallInfo[Any],
        report: Any,
    ) -> None:
        """Capture structured expectation data straight off the exception.

        pytest calls this *after* ``logreport`` for the same node, so by now a
        rendered traceback may already be sitting in ``message``. Structured
        expectations supersede it.
        """
        if call.excinfo is None or not isinstance(node, pytest.Item):
            return
        record = self._touch(report.nodeid, getattr(report, "location", None))
        _attach_exception(record, call.excinfo.value)

    def _touch(self, nodeid: str, location: Any) -> dict[str, Any]:
        key = _normalize(str(nodeid))
        record = self._cases.get(key)
        if record is not None:
            return record

        file_path, name = _split_nodeid(key)
        line = 0
        location_path = file_path
        if location:
            location_path, raw_line, _ = location
            # pytest reports 0-indexed lines; editors are 1-indexed.
            line = (raw_line or 0) + 1
        record = {
            "id": key,
            "file": file_path,
            "name": name,
            "status": "passed",
            "durationMs": 0,
            "location": {"path": _normalize(str(location_path)), "line": line},
        }
        self._cases[key] = record
        self._order.append(key)
        return record

    # -- output -------------------------------------------------------------

    def pytest_sessionfinish(self, session: pytest.Session, exitstatus: int) -> None:
        del session
        for nodeid, record in self._cases.items():
            item_concept = self._concepts.get(nodeid)
            if item_concept and not record.get("concept"):
                record["concept"] = item_concept

        document = {
            "schema": 1,
            "exitStatus": int(exitstatus),
            "collectionErrors": self._collection_errors,
            "cases": [self._cases[nodeid] for nodeid in self._order],
        }
        directory = os.path.dirname(self._path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        with open(self._path, "w", encoding="utf-8") as handle:
            json.dump(document, handle)

    # -- markers ------------------------------------------------------------

    def pytest_collection_modifyitems(self, items: list[pytest.Item]) -> None:
        """Read authored ``@pytest.mark.concept("dict-lookup")`` markers."""
        concepts: dict[str, str] = {}
        for item in items:
            marker = item.get_closest_marker("concept")
            if marker and marker.args:
                concepts[_normalize(item.nodeid)] = str(marker.args[0])
        self._concepts = concepts


def _describe(error: BaseException) -> str:
    """`NotImplementedError` reads better than `NotImplementedError: ` when the
    exception carries no message of its own."""
    text = str(error).strip()
    name = type(error).__name__
    return f"{name}: {text}" if text else name


def _attach_exception(record: dict[str, Any], error: BaseException) -> None:
    record["exceptionType"] = type(error).__name__

    expected = getattr(error, "retrainer_expected", None)
    received = getattr(error, "retrainer_received", None)
    if expected is not None:
        record["expected"] = str(expected)
    if received is not None:
        record["received"] = str(received)

    retrainer_message = getattr(error, "retrainer_message", None)
    if retrainer_message:
        record["message"] = str(retrainer_message)
    elif expected is not None or received is not None:
        # The expected/received pair says everything the traceback would, and
        # says it in the learner's terms. Drop whatever logreport left behind.
        record.pop("message", None)
    else:
        record["message"] = _shorten(_describe(error))

    concept = getattr(error, "retrainer_concept", None)
    if concept:
        record["concept"] = str(concept)

    if not isinstance(error, AssertionError) and "received" not in record:
        # For a raw exception the type and message are the whole story.
        record["received"] = _shorten(_describe(error))


def _longrepr_text(report: Any) -> str:
    longrepr = getattr(report, "longrepr", None)
    if longrepr is None:
        return ""
    reprcrash = getattr(longrepr, "reprcrash", None)
    message = getattr(reprcrash, "message", None)
    if message:
        return str(message)
    return str(longrepr)


def _shorten(text: str, limit: int = 2000) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[:limit] + "\n... truncated ..."
