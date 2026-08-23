# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""The ordinary cases."""

import pytest

from retrainer.expect import expect_equal
from main import load_records, read_lines, save_records, write_lines


@pytest.fixture
def workspace(tmp_path):
    return tmp_path


@pytest.mark.concept("python.engineering.files")
def test_round_trip_lines(workspace):
    path = workspace / "notes.txt"
    write_lines(path, ["one", "two"])
    expect_equal(read_lines(path), ["one", "two"])


@pytest.mark.concept("python.engineering.files")
def test_missing_file_reads_as_nothing(workspace):
    expect_equal(read_lines(workspace / "absent.txt"), [])
    expect_equal(load_records(workspace / "absent.json"), [])


@pytest.mark.concept("python.stdlib.json")
def test_round_trip_records(workspace):
    path = workspace / "data.json"
    save_records(path, [{"name": "ada", "score": 1}])
    expect_equal(load_records(path), [{"name": "ada", "score": 1}])


@pytest.mark.concept("python.stdlib.pathlib")
def test_missing_directories_are_created(workspace):
    path = workspace / "deep" / "deeper" / "notes.txt"
    write_lines(path, ["here"])
    expect_equal(read_lines(path), ["here"])


@pytest.mark.concept("python.stdlib.pathlib")
def test_records_also_create_their_directories(workspace):
    """Both writers need the parent to exist, and both must still work when
    it already does."""
    path = workspace / "reports" / "2026" / "data.json"
    save_records(path, [{"a": 1}])
    expect_equal(load_records(path), [{"a": 1}])
    save_records(path, [{"a": 2}])
    expect_equal(load_records(path), [{"a": 2}])
