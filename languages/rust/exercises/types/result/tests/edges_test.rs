// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{first_valid, parse_pair, parse_port, ParseError};

#[test]
fn both_ends_of_the_range_are_valid() {
    assert_eq!(parse_port("1"), Ok(1));
    assert_eq!(parse_port("65535"), Ok(65535));
}

#[test]
fn zero_and_beyond_are_out_of_range() {
    assert_eq!(parse_port("0"), Err(ParseError::OutOfRange));
    // Parsing into u16 directly would call this NotANumber, which is the
    // distinction this case exists to protect.
    assert_eq!(parse_port("70000"), Err(ParseError::OutOfRange));
}

#[test]
fn surrounding_whitespace_is_tolerated() {
    assert_eq!(parse_port("  8080  "), Ok(8080));
}

#[test]
fn nothing_valid_is_none_rather_than_a_panic() {
    assert_eq!(first_valid(&["", "nope"]), None);
    assert_eq!(first_valid(&[]), None);
}

#[test]
fn a_pair_returns_the_first_failure() {
    assert_eq!(parse_pair("nope", "0"), Err(ParseError::NotANumber));
    assert_eq!(parse_pair("80", "0"), Err(ParseError::OutOfRange));
}
