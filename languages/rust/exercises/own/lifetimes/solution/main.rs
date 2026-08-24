// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Borrowing without copying: slices that point into the text they came from.

/// The longest word in the text, or None when there are none.
pub fn longest_word(text: &str) -> Option<&str> {
    // No lifetime annotation is needed: with one input reference the
    // compiler assigns the output the same lifetime automatically.
    text.split_whitespace().max_by_key(|word| word.len())
}

/// Every line, trimmed, with blank ones dropped.
pub fn meaningful_lines(text: &str) -> Vec<&str> {
    // The Vec is owned; the strings inside it are not. Nothing is copied,
    // and the whole result is invalid the moment `text` goes away — which
    // is exactly what the lifetime records.
    text.lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect()
}

/// The value part of a `key = value` line, trimmed.
pub fn value_of<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    // Two input references and one output, so the annotation is required:
    // the compiler cannot guess whether the result borrows from the line or
    // from the key, and here it is always the line.
    let (found, value) = line.split_once('=')?;
    if found.trim() != key {
        return None;
    }
    Some(value.trim())
}

/// The common prefix of two strings.
pub fn common_prefix<'a>(left: &'a str, right: &str) -> &'a str {
    let mut end = 0;

    // Walking by char_indices rather than by byte: slicing a str in the
    // middle of a multi-byte character panics rather than returning
    // nonsense, so the boundary has to be a real one.
    for ((index, a), b) in left.char_indices().zip(right.chars()) {
        if a != b {
            return &left[..index];
        }
        end = index + a.len_utf8();
    }

    &left[..end]
}
