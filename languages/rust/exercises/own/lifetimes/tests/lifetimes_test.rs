// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{common_prefix, longest_word, meaningful_lines, value_of};

#[test]
fn longest_word_finds_the_longest() {
    // One unambiguous longest word: ties are their own case, in the edges.
    assert_eq!(longest_word("the quickest brown fox"), Some("quickest"));
}

#[test]
fn longest_word_of_nothing_is_none() {
    assert_eq!(longest_word(""), None);
    assert_eq!(longest_word("   \n\t "), None);
}

#[test]
fn meaningful_lines_trims_and_drops_blanks() {
    let text = "  first  \n\n   \nsecond\n";
    assert_eq!(meaningful_lines(text), vec!["first", "second"]);
}

#[test]
fn value_of_reads_the_right_key() {
    assert_eq!(value_of("port = 8080", "port"), Some("8080"));
    assert_eq!(value_of("host = example", "port"), None);
}

#[test]
fn value_of_needs_a_separator() {
    assert_eq!(value_of("port 8080", "port"), None);
}

#[test]
fn common_prefix_finds_the_shared_start() {
    assert_eq!(common_prefix("filename.txt", "filename.md"), "filename.");
    assert_eq!(common_prefix("abc", "abc"), "abc");
}

#[test]
fn common_prefix_of_unrelated_strings_is_empty() {
    assert_eq!(common_prefix("abc", "xyz"), "");
}
