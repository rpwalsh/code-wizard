// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Borrowing without copying: slices that point into the text they came from.

/// The longest word in the text, or None when there are none.
pub fn longest_word(text: &str) -> Option<&str> {
    unimplemented!()
}

/// Every line, trimmed, with blank ones dropped.
pub fn meaningful_lines(text: &str) -> Vec<&str> {
    unimplemented!()
}

/// The value part of a `key = value` line, trimmed.
pub fn value_of<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    unimplemented!()
}

/// The common prefix of two strings.
pub fn common_prefix<'a>(left: &'a str, right: &str) -> &'a str {
    unimplemented!()
}
