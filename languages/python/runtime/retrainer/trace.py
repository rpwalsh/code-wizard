# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Record what a program actually did, line by line.

The instrument behind "increase observability before increasing explanation".
When a learner cannot say why their code produced 41 instead of 42, the useful
response is not a better sentence — it is the ability to watch the value
change.

What it records, per executed line: where it was, how deep in the call stack,
and *which names changed*. Deltas rather than full snapshots, because a full
dump per step is mostly repetition and the interesting thing is precisely what
moved. A viewer replays the deltas forward to reconstruct the state at any
step, which is exactly what a scrubber needs.

Every limit here exists because tracing learner code means tracing code that
may not terminate and may build values too large to print.
"""

from __future__ import annotations

import json
import os
import reprlib
import sys
import threading
from types import FrameType
from typing import Any, Callable

__all__ = ["trace_program", "trace_test", "TraceLimits"]


class _BudgetExhausted(BaseException):
    """Raised inside the traced program when the step budget runs out.

    Deriving from ``BaseException`` rather than ``Exception`` so an ordinary
    ``except Exception`` in learner code cannot swallow it. A bare ``except:``
    still can, which is why the host timeout remains the backstop.
    """

_repr = reprlib.Repr()
_repr.maxstring = 120
_repr.maxother = 120
_repr.maxlist = 12
_repr.maxdict = 12
_repr.maxtuple = 12
_repr.maxset = 12
_repr.maxdeque = 12
_repr.maxlevel = 3


class TraceLimits:
    """Ceilings on a trace. Reached limits are reported, never silently hit."""

    def __init__(self, max_steps: int = 4000, max_depth: int = 24) -> None:
        self.max_steps = max(1, max_steps)
        self.max_depth = max(1, max_depth)


def _render(value: Any) -> str:
    try:
        return _repr.repr(value)
    except Exception:  # noqa: BLE001 - repr of a hostile object must not stop a trace
        return f"<unrepresentable {type(value).__name__}>"


def _snapshot(frame: FrameType) -> dict[str, str]:
    """Local names as displayable text.

    Dunder names and modules are dropped: they are never what the learner is
    reasoning about, and they would crowd out the two variables that are.
    """
    rendered: dict[str, str] = {}
    for name, value in frame.f_locals.items():
        if name.startswith("__"):
            continue
        if type(value).__name__ == "module":
            continue
        rendered[name] = _render(value)
    return rendered


class _Recorder:
    """Collects steps under a step budget."""

    def __init__(self, workspace: str, limits: TraceLimits) -> None:
        self._workspace = os.path.abspath(workspace)
        self._limits = limits
        self._previous: dict[int, dict[str, str]] = {}
        # Depth is reported relative to the outermost traced frame. Counting
        # absolute frames would leak the host into the recording: a subprocess
        # and a WebAssembly worker sit at different stack depths, and the
        # learner's call nesting is identical in both.
        self._base_depth: int | None = None
        self.steps: list[dict[str, Any]] = []
        self.truncated = False
        self.error: dict[str, str] | None = None

    def _is_learner_code(self, frame: FrameType) -> bool:
        """Only the learner's own files.

        Stepping into the standard library answers a question nobody asked and
        would burn the entire step budget inside ``json`` or ``pytest``.
        """
        filename = frame.f_code.co_filename
        if not filename or filename.startswith("<"):
            return False
        return os.path.abspath(filename).startswith(self._workspace)

    def _relative(self, frame: FrameType) -> str:
        return os.path.relpath(os.path.abspath(frame.f_code.co_filename), self._workspace).replace(
            os.sep, "/"
        )

    def _depth(self, frame: FrameType) -> int:
        absolute = 0
        parent = frame.f_back
        while parent is not None and absolute <= self._limits.max_depth + 64:
            absolute += 1
            parent = parent.f_back

        if self._base_depth is None:
            self._base_depth = absolute
        return max(0, absolute - self._base_depth)

    def __call__(self, frame: FrameType, event: str, arg: Any) -> Callable[..., Any] | None:
        if not self._is_learner_code(frame):
            return None

        if len(self.steps) >= self._limits.max_steps:
            # Stopping the *recording* would leave a non-terminating program
            # running to the host's timeout, so the budget has to stop the
            # program. Bounded tracing that degrades into an unbounded run is
            # not bounded.
            self.truncated = True
            raise _BudgetExhausted()

        key = id(frame)

        if event == "call":
            self._previous[key] = {}
            # The module frame's own call event carries no information — no
            # arguments, no line — and only adds noise to the timeline.
            if frame.f_code.co_name != "<module>":
                self._record(frame, "call", {}, None)
            return self

        if event == "line":
            current = _snapshot(frame)
            previous = self._previous.get(key, {})
            changes = {
                name: value for name, value in current.items() if previous.get(name) != value
            }
            self._previous[key] = current
            self._record(frame, "line", changes, None)
            return self

        if event == "return":
            self._record(frame, "return", {}, _render(arg))
            self._previous.pop(key, None)
            return self

        if event == "exception":
            kind = arg[0].__name__ if isinstance(arg, tuple) and arg else "Exception"
            if kind == "_BudgetExhausted":
                return self
            detail = str(arg[1]) if isinstance(arg, tuple) and len(arg) > 1 else ""
            self.error = {"type": kind, "message": detail, "line": str(frame.f_lineno)}
            self._record(frame, "exception", {}, f"{kind}: {detail}".strip(": "))
            return self

        return self

    def _record(
        self,
        frame: FrameType,
        event: str,
        changes: dict[str, str],
        detail: str | None,
    ) -> None:
        step: dict[str, Any] = {
            "event": event,
            "file": self._relative(frame),
            "line": frame.f_lineno,
            "function": frame.f_code.co_name,
            "depth": self._depth(frame),
        }
        if changes:
            step["changes"] = changes
        if detail is not None:
            step["detail"] = detail
        self.steps.append(step)


def _run_traced(workspace: str, recorder: "_Recorder", body: Callable[[], int]) -> tuple[int, str, str]:
    """Run `body` under the tracer with streams captured and cwd set."""
    import contextlib
    import io

    out = io.StringIO()
    err = io.StringIO()
    exit_code = 0

    previous_cwd = os.getcwd()
    os.chdir(workspace)
    if workspace not in sys.path:
        sys.path.insert(0, workspace)

    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            sys.settrace(recorder)
            # Threads spawned by learner code would otherwise run untraced.
            threading.settrace(recorder)
            try:
                exit_code = body()
            finally:
                sys.settrace(None)
                threading.settrace(None)
    finally:
        try:
            os.chdir(previous_cwd)
        except OSError:
            os.chdir("/")

    return exit_code, out.getvalue(), err.getvalue()


def _document(
    recorder: "_Recorder",
    limits: TraceLimits,
    exit_code: int,
    stdout: str,
    stderr: str,
    max_output: int,
) -> str:
    return json.dumps(
        {
            "schema": 1,
            "steps": recorder.steps,
            "truncated": recorder.truncated,
            "maxSteps": limits.max_steps,
            "exitCode": exit_code,
            "stdout": stdout[:max_output],
            "stderr": stderr[:max_output],
            "error": recorder.error,
        }
    )


def trace_test(
    workspace: str,
    node_id: str,
    max_steps: int,
    max_output: int,
) -> str:
    """Record one test running.

    This is the trace that matters. An exercise's `main.py` usually only
    *defines* things, so tracing it shows nothing happening; what the learner
    wants to watch is the failing test calling their code. Running it through
    pytest rather than calling the function directly means fixtures,
    parametrisation and setup all behave exactly as they did when it failed.

    Step recording is already restricted to the workspace, so pytest's own
    machinery never appears — only the test and the code under it.
    """
    import traceback

    limits = TraceLimits(max_steps=max_steps)
    recorder = _Recorder(workspace, limits)

    def body() -> int:
        try:
            import pytest

            return int(
                pytest.main(
                    [
                        "-q",
                        "--no-header",
                        "--color=no",
                        "-p",
                        "no:cacheprovider",
                        "--capture=no",
                        node_id,
                    ]
                )
            )
        except _BudgetExhausted:
            raise
        except BaseException:  # noqa: BLE001
            traceback.print_exc()
            return 1

    try:
        exit_code, stdout, stderr = _run_traced(workspace, recorder, body)
    except _BudgetExhausted:
        exit_code, stdout, stderr = 0, "", ""

    return _document(recorder, limits, exit_code, stdout, stderr, max_output)


def trace_program(
    workspace: str,
    entry_point: str,
    max_steps: int,
    max_output: int,
    stdin_text: str = "",
) -> str:
    """Run one file under the tracer and return the recording as JSON.

    Imported lazily by the host so that a runtime without tracing support can
    simply not call it.
    """
    import contextlib
    import io
    import runpy
    import traceback

    limits = TraceLimits(max_steps=max_steps)
    recorder = _Recorder(workspace, limits)

    out = io.StringIO()
    err = io.StringIO()
    exit_code = 0

    previous_cwd = os.getcwd()
    previous_stdin = sys.stdin
    os.chdir(workspace)
    if workspace not in sys.path:
        sys.path.insert(0, workspace)
    sys.stdin = io.StringIO(stdin_text)

    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            sys.settrace(recorder)
            # Threads spawned by learner code would otherwise run untraced.
            threading.settrace(recorder)
            try:
                runpy.run_path(os.path.join(workspace, entry_point), run_name="__main__")
            except _BudgetExhausted:
                # Expected: the recording is complete up to the budget, and the
                # caller is told the program had not finished.
                exit_code = 0
            except SystemExit as stop:
                exit_code = stop.code if isinstance(stop.code, int) else 1
            except BaseException:  # noqa: BLE001 - learner code may raise anything
                traceback.print_exc()
                exit_code = 1
            finally:
                sys.settrace(None)
                threading.settrace(None)
    finally:
        sys.stdin = previous_stdin
        try:
            os.chdir(previous_cwd)
        except OSError:
            os.chdir("/")

    return json.dumps(
        {
            "schema": 1,
            "steps": recorder.steps,
            "truncated": recorder.truncated,
            "maxSteps": limits.max_steps,
            "exitCode": exit_code,
            "stdout": out.getvalue()[:max_output],
            "stderr": err.getvalue()[:max_output],
            "error": recorder.error,
        }
    )
