"""Emit parse-time diagnostics for a set of files as JSON.

Always available: it needs nothing beyond the interpreter, so the editor gutter
never depends on the learner having installed a linter.

Usage: python forge_diagnose.py <report-path> <file> [<file> ...]
"""

from __future__ import annotations

import json
import os
import sys


def _normalise(value: str) -> str:
    return value.replace(os.sep, "/").replace("\\", "/")


def diagnose(root: str, paths: list[str]) -> list[dict[str, object]]:
    diagnostics: list[dict[str, object]] = []
    for path in paths:
        absolute = os.path.join(root, path)
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
                    "location": {"path": _normalise(path), "line": 1, "column": 1},
                }
            )
            continue

        try:
            compile(source, path, "exec", dont_inherit=True)
        except SyntaxError as error:
            diagnostics.append(
                {
                    "severity": "error",
                    "message": error.msg or "invalid syntax",
                    "code": type(error).__name__,
                    "source": "compile",
                    "location": {
                        "path": _normalise(path),
                        "line": error.lineno or 1,
                        "column": error.offset or 1,
                        "endLine": getattr(error, "end_lineno", None) or error.lineno or 1,
                        "endColumn": getattr(error, "end_offset", None) or error.offset or 1,
                    },
                }
            )
        except ValueError as error:
            # e.g. source containing a NUL byte.
            diagnostics.append(
                {
                    "severity": "error",
                    "message": str(error),
                    "code": "ValueError",
                    "source": "compile",
                    "location": {"path": _normalise(path), "line": 1, "column": 1},
                }
            )
    return diagnostics


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: forge_diagnose.py <report-path> <file>...", file=sys.stderr)
        return 2
    report_path, *paths = argv
    root = os.getcwd()
    document = {"schema": 1, "diagnostics": diagnose(root, paths)}
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(document, handle)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
