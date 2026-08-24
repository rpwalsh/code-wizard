# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""In-WASM host helpers for the Pyodide runtime.

The JavaScript side owns lifecycle and timeouts; everything that is easier to
say in Python — materializing a workspace, capturing output, running a program
or a pytest session — lives here. Every entry point returns a JSON string, so
the boundary carries plain data rather than Python object proxies.

This file is the browser counterpart of the process spawning that the desktop
runtime does. The support modules it loads (``retrainer.report``, ``retrainer.expect``)
are the *same files* the desktop runtime puts on PYTHONPATH.
"""

from __future__ import annotations

import contextlib
import importlib
import io
import json
import os
import runpy
import shutil
import sys
import traceback
from typing import Any

WORKSPACE = "/work"
SUPPORT = "/code-wizard"

__all__ = [
    "reset_workspace",
    "write_files",
    "run_program",
    "run_tests",
    "trace",
    "trace_test_case",
    "diagnose",
]


class _BoundedWriter(io.TextIOBase):
    """Collects output up to a byte limit, then counts and discards.

    The same guarantee the desktop runtime gets from a bounded pipe buffer: a
    runaway ``print`` loop must not be able to exhaust the tab's memory.
    """

    def __init__(self, limit: int) -> None:
        self._limit = max(0, limit)
        self._chunks: list[str] = []
        self._size = 0
        self.truncated = False

    def writable(self) -> bool:
        return True

    def write(self, text: str) -> int:
        encoded_length = len(text.encode("utf-8", errors="replace"))
        if self._size >= self._limit:
            self.truncated = True
            return len(text)
        remaining = self._limit - self._size
        if encoded_length <= remaining:
            self._chunks.append(text)
            self._size += encoded_length
            return len(text)
        # Cut on a character boundary rather than mid-codepoint.
        clipped = text.encode("utf-8", errors="replace")[:remaining].decode(
            "utf-8", errors="ignore"
        )
        self._chunks.append(clipped)
        self._size = self._limit
        self.truncated = True
        return len(text)

    def value(self) -> str:
        text = "".join(self._chunks)
        return text + "\n... output truncated ..." if self.truncated else text


def _ensure_support_on_path() -> None:
    for entry in (WORKSPACE, SUPPORT):
        if entry not in sys.path:
            sys.path.insert(0, entry)


def _purge_workspace_modules() -> None:
    """Forget every module imported from the workspace.

    Without this the learner edits ``main.py``, presses Run, and the previous
    version executes: Python caches modules by name for the life of the
    interpreter, and in the browser the interpreter lives for the life of the
    tab.
    """
    doomed = []
    for name, module in sys.modules.items():
        origin = getattr(module, "__file__", None)
        if origin and os.path.abspath(origin).startswith(WORKSPACE):
            doomed.append(name)
    for name in doomed:
        del sys.modules[name]
    importlib.invalidate_caches()


def reset_workspace() -> None:
    """Discard the previous run's files. Isolation is per execution."""
    shutil.rmtree(WORKSPACE, ignore_errors=True)
    os.makedirs(WORKSPACE, exist_ok=True)
    _purge_workspace_modules()


def write_files(payload: str) -> None:
    """Materialize ``{path: contents}`` under the workspace root."""
    for relative_path, contents in json.loads(payload).items():
        target = os.path.normpath(os.path.join(WORKSPACE, relative_path))
        # The TypeScript side validates paths, but this is the last gate before
        # a write and cheap to keep honest.
        if not target.startswith(WORKSPACE + os.sep) and target != WORKSPACE:
            raise ValueError(f"unsafe workspace path: {relative_path}")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as handle:
            handle.write(contents)


@contextlib.contextmanager
def _session(stdin_text: str | None, limit: int):
    """Run with redirected streams, a fixed cwd, and the workspace importable."""
    out = _BoundedWriter(limit)
    err = _BoundedWriter(limit)
    previous_stdin = sys.stdin
    previous_argv = list(sys.argv)
    previous_cwd = os.getcwd()

    os.chdir(WORKSPACE)
    _ensure_support_on_path()
    sys.stdin = io.StringIO(stdin_text or "")
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            yield out, err
    finally:
        sys.stdin = previous_stdin
        sys.argv = previous_argv
        try:
            os.chdir(previous_cwd)
        except OSError:
            os.chdir("/")


def run_program(entry_point: str, argv_json: str, stdin_text: str, limit: int) -> str:
    """Execute one file as ``__main__`` and report what happened."""
    _purge_workspace_modules()
    exit_code = 0

    with _session(stdin_text, limit) as (out, err):
        sys.argv = [entry_point, *json.loads(argv_json)]
        try:
            runpy.run_path(os.path.join(WORKSPACE, entry_point), run_name="__main__")
        except SystemExit as stop:
            # `sys.exit("message")` sets a string, not a status.
            if stop.code is None:
                exit_code = 0
            elif isinstance(stop.code, int):
                exit_code = stop.code
            else:
                print(stop.code, file=sys.stderr)
                exit_code = 1
        except BaseException:  # noqa: B902 - learner code may raise anything
            traceback.print_exc()
            exit_code = 1

    return json.dumps(
        {
            "exitCode": exit_code,
            "stdout": out.value(),
            "stderr": err.value(),
            "truncated": out.truncated or err.truncated,
        }
    )


def run_tests(targets_json: str, report_path: str, limit: int) -> str:
    """Run pytest with the Code Wizard reporting plugin loaded."""
    _purge_workspace_modules()
    targets = json.loads(targets_json)
    status = -1

    with _session(None, limit) as (out, err):
        try:
            import pytest

            status = int(
                pytest.main(
                    [
                        "-q",
                        "--no-header",
                        "--color=no",
                        "-r",
                        "N",
                        # pytest's default capture dup2()s file descriptors 1
                        # and 2. WebAssembly has no such descriptors, and the
                        # attempt is a fatal error rather than a failure. We
                        # have already redirected sys.stdout/sys.stderr above,
                        # so pytest writing to them lands in our buffer anyway.
                        "--capture=no",
                        "-p",
                        "no:cacheprovider",
                        "-p",
                        "retrainer.report",
                        "--retrainer-report",
                        report_path,
                        *targets,
                    ]
                )
            )
        except BaseException:  # noqa: B902
            traceback.print_exc()
            status = -1

    report: Any = None
    if os.path.exists(report_path):
        with open(report_path, "r", encoding="utf-8") as handle:
            report = handle.read()

    return json.dumps(
        {
            "exitStatus": status,
            "stdout": out.value(),
            "stderr": err.value(),
            "truncated": out.truncated or err.truncated,
            "report": report,
        }
    )


def trace(entry_point: str, stdin_text: str, max_steps: int, limit: int) -> str:
    """Record an execution trace.

    The tracer itself is the same ``retrainer.trace`` module the desktop runtime
    runs in a subprocess — only the host differs, so a learner stepping through
    a loop in the browser sees exactly what they would see on the desktop.
    """
    _purge_workspace_modules()
    from retrainer.trace import trace_program

    return trace_program(WORKSPACE, entry_point, max_steps, limit, stdin_text)


def trace_test_case(node_id: str, max_steps: int, limit: int) -> str:
    """Record one test running, so a red test can be watched rather than read."""
    _purge_workspace_modules()
    from retrainer.trace import trace_test

    return trace_test(WORKSPACE, node_id, max_steps, limit)


def diagnose(paths_json: str) -> str:
    """Compile each file and report syntax errors, without executing anything."""
    diagnostics = []
    for relative_path in json.loads(paths_json):
        absolute = os.path.join(WORKSPACE, relative_path)
        try:
            with open(absolute, "r", encoding="utf-8") as handle:
                source = handle.read()
        except OSError as error:
            diagnostics.append(
                {
                    "severity": "error",
                    "message": f"could not read file: {error.strerror or error}",
                    "code": "IOError",
                    "source": "compile",
                    "location": {"path": relative_path, "line": 1, "column": 1},
                }
            )
            continue

        try:
            compile(source, relative_path, "exec", dont_inherit=True)
        except SyntaxError as error:
            diagnostics.append(
                {
                    "severity": "error",
                    "message": error.msg or "invalid syntax",
                    "code": type(error).__name__,
                    "source": "compile",
                    "location": {
                        "path": relative_path,
                        "line": error.lineno or 1,
                        "column": error.offset or 1,
                        "endLine": getattr(error, "end_lineno", None) or error.lineno or 1,
                        "endColumn": getattr(error, "end_offset", None) or error.offset or 1,
                    },
                }
            )
        except ValueError as error:
            diagnostics.append(
                {
                    "severity": "error",
                    "message": str(error),
                    "code": "ValueError",
                    "source": "compile",
                    "location": {"path": relative_path, "line": 1, "column": 1},
                }
            )

    return json.dumps({"schema": 1, "diagnostics": diagnostics})
