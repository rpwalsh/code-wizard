// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{common_prefix, longest_word, meaningful_lines, value_of};

#[test]
fn the_result_really_borrows_rather_than_copying() {
    let text = String::from("alpha beta gammaa");
    let word = longest_word(&text).unwrap();

    // The slice points inside the original allocation. If this were a copy
    // the pointers would differ, and nothing about the exercise would be
    // demonstrated.
    let start = word.as_ptr() as usize;
    let base = text.as_ptr() as usize;
    assert!(start >= base && start < base + text.len());
}

#[test]
fn a_tie_is_resolved_consistently() {
    // max_by_key keeps the last maximum; documenting which is part of the
    // contract, because "either" is not an answer a test can hold.
    assert_eq!(longest_word("aaa bbb"), Some("bbb"));
}

#[test]
fn one_word_is_its_own_longest() {
    assert_eq!(longest_word("solo"), Some("solo"));
}

#[test]
fn meaningful_lines_of_blank_text_is_empty() {
    assert_eq!(meaningful_lines(""), Vec::<&str>::new());
    assert_eq!(meaningful_lines("\n\n  \n"), Vec::<&str>::new());
}

#[test]
fn meaningful_lines_keeps_interior_spacing() {
    assert_eq!(meaningful_lines("  a  b  "), vec!["a  b"]);
}

#[test]
fn value_of_allows_an_empty_value() {
    // `port =` is somebody clearing it, which is different from absent.
    assert_eq!(value_of("port =", "port"), Some(""));
}

#[test]
fn value_of_keeps_a_separator_inside_the_value() {
    // Splitting on every '=' would lose the rest of a connection string.
    assert_eq!(
        value_of("dsn = host=db;port=5432", "dsn"),
        Some("host=db;port=5432")
    );
}

#[test]
fn common_prefix_stops_on_a_character_boundary() {
    // Slicing a str in the middle of a multi-byte character panics. Walking
    // by bytes would do exactly that here.
    assert_eq!(common_prefix("héllo", "hétre"), "hé");
    assert_eq!(common_prefix("日本語", "日本人"), "日本");
}

#[test]
fn common_prefix_handles_one_string_being_a_prefix_of_the_other() {
    assert_eq!(common_prefix("file", "filename"), "file");
    assert_eq!(common_prefix("filename", "file"), "file");
}

#[test]
fn common_prefix_with_an_empty_side_is_empty() {
    assert_eq!(common_prefix("", "anything"), "");
    assert_eq!(common_prefix("anything", ""), "");
}
