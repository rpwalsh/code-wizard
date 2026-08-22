"""Trailing newlines, bad JSON, and what does not survive."""

import pytest

from retrainer.expect import expect_equal, expect_raises
from main import load_records, read_lines, save_records, write_lines


@pytest.fixture
def workspace(tmp_path):
    return tmp_path


@pytest.mark.concept("python.engineering.files")
def test_the_trailing_newline_is_not_a_line():
    """Splitting on the newline character gives a final empty piece. Nearly
    every "why is there a blank row at the end" bug is this."""
    pass


@pytest.mark.concept("python.engineering.files")
def test_a_file_ending_in_a_newline(workspace):
    path = workspace / "notes.txt"
    write_lines(path, ["one", "two"])
    expect_equal(len(read_lines(path)), 2)


@pytest.mark.concept("python.engineering.files")
def test_writing_nothing_gives_an_empty_file(workspace):
    path = workspace / "empty.txt"
    write_lines(path, [])
    expect_equal(read_lines(path), [])


@pytest.mark.concept("python.engineering.files")
def test_blank_lines_in_the_middle_are_kept(workspace):
    path = workspace / "gapped.txt"
    write_lines(path, ["one", "", "three"])
    expect_equal(read_lines(path), ["one", "", "three"])


@pytest.mark.concept("python.stdlib.json")
def test_invalid_json_raises_rather_than_returning_nothing(workspace):
    path = workspace / "broken.json"
    write_lines(path, ["{not json"])
    expect_raises(ValueError, lambda: load_records(path))


@pytest.mark.concept("python.stdlib.json")
def test_an_empty_record_list_round_trips(workspace):
    path = workspace / "none.json"
    save_records(path, [])
    expect_equal(load_records(path), [])


@pytest.mark.concept("python.stdlib.json")
def test_tuples_come_back_as_lists(workspace):
    """JSON does not round-trip Python. This is a surprise exactly once."""
    path = workspace / "shapes.json"
    save_records(path, [{"pair": (1, 2)}])
    expect_equal(load_records(path), [{"pair": [1, 2]}])


@pytest.mark.concept("python.stdlib.json")
def test_writing_replaces_rather_than_appends(workspace):
    path = workspace / "twice.txt"
    write_lines(path, ["first"])
    write_lines(path, ["second"])
    expect_equal(read_lines(path), ["second"])
