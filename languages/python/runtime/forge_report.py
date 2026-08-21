"""pytest plugin that emits a structured JSON report for Forge.

Parsing human-readable pytest output is brittle and version-dependent, so the
runtime adapter never does it. This plugin writes one JSON document describing
every test case, which the TypeScript side reads directly.

Loaded explicitly with ``-p forge_report``; the runtime puts this directory on
PYTHONPATH. Only stable, non-wrapper hooks are used so the plugin keeps working
across pytest majors.
"""

from __future__ import annotations

import json
import os
from typing import Any

import pytest

_REPORT_OPTION = "--forge-report"


def pytest_addoption(parser: pytest.Parser) -> None:
    group = parser.getgroup("forge", "Forge structured reporting")
    group.addoption(
        _REPORT_OPTION,
        action="store",
        dest="forge_report",
        default=None,
        metavar="PATH",
        help="Write a structured JSON report of the run to PATH.",
    )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "concept(name): the skill this test probes, shown when it fails.",
    )
    path = config.getoption("forge_report", default=None)
    if path:
        config.pluginmanager.register(ForgeReporter(path), "forge-reporter")


def _normalise(value: str) -> str:
    return value.replace(os.sep, "/").replace("\\", "/")


def _split_nodeid(nodeid: str) -> tuple[str, str]:
    normalised = _normalise(nodeid)
    file_path, _, remainder = normalised.partition("::")
    return file_path, remainder or file_path


class ForgeReporter:
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
                "path": _normalise(str(report.nodeid)),
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

        This runs before ``logreport`` for the same node, which is why the
        message written here wins over the rendered traceback.
        """
        if call.excinfo is None or not isinstance(node, pytest.Item):
            return
        record = self._touch(report.nodeid, getattr(report, "location", None))
        _attach_exception(record, call.excinfo.value)

    def _touch(self, nodeid: str, location: Any) -> dict[str, Any]:
        key = _normalise(str(nodeid))
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
            "location": {"path": _normalise(str(location_path)), "line": line},
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
                concepts[_normalise(item.nodeid)] = str(marker.args[0])
        self._concepts = concepts


def _attach_exception(record: dict[str, Any], error: BaseException) -> None:
    record["exceptionType"] = type(error).__name__

    expected = getattr(error, "forge_expected", None)
    received = getattr(error, "forge_received", None)
    if expected is not None:
        record["expected"] = str(expected)
    if received is not None:
        record["received"] = str(received)

    forge_message = getattr(error, "forge_message", None)
    if forge_message:
        record["message"] = str(forge_message)
    else:
        record["message"] = _shorten(f"{type(error).__name__}: {error}".strip())

    concept = getattr(error, "forge_concept", None)
    if concept:
        record["concept"] = str(concept)

    if not isinstance(error, AssertionError) and "received" not in record:
        # For a raw exception the type and message are the whole story.
        record["received"] = _shorten(f"{type(error).__name__}: {error}")


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
