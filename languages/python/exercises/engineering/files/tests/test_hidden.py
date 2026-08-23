# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Cases the visible tests did not reach."""

import pytest

from retrainer.expect import expect_equal
from main import load_records, read_lines, save_records, write_lines


@pytest.fixture
def workspace(tmp_path):
    return tmp_path


@pytest.mark.concept("python.engineering.files")
def test_text_beyond_plain_ascii_survives(workspace):
    """The default encoding depends on the platform, so this is the character
    that is never in your test data and always in real data."""
    path = workspace / "accents.txt"
    write_lines(path, ["naïve café", "日本語"])
    expect_equal(read_lines(path), ["naïve café", "日本語"])


@pytest.mark.concept("python.engineering.files")
def test_a_single_line(workspace):
    path = workspace / "one.txt"
    write_lines(path, ["only"])
    expect_equal(read_lines(path), ["only"])


@pytest.mark.concept("python.stdlib.json")
def test_nested_records_round_trip(workspace):
    path = workspace / "nested.json"
    records = [{"name": "a", "tags": ["x", "y"], "meta": {"n": 1}}]
    save_records(path, records)
    expect_equal(load_records(path), records)


@pytest.mark.concept("python.stdlib.json")
def test_saving_replaces_the_previous_contents(workspace):
    path = workspace / "replace.json"
    save_records(path, [{"a": 1}, {"b": 2}])
    save_records(path, [{"c": 3}])
    expect_equal(load_records(path), [{"c": 3}])


@pytest.mark.concept("python.stdlib.pathlib")
def test_a_path_given_as_a_string_works_too(workspace):
    path = str(workspace / "stringly.txt")
    write_lines(path, ["fine"])
    expect_equal(read_lines(path), ["fine"])


@pytest.mark.concept("python.stdlib.json")
def test_numbers_keep_their_type(workspace):
    path = workspace / "numbers.json"
    save_records(path, [{"whole": 1, "fraction": 1.5}])
    loaded = load_records(path)
    expect_equal(isinstance(loaded[0]["whole"], int), True)
    expect_equal(isinstance(loaded[0]["fraction"], float), True)
