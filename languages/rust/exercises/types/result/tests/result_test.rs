// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{first_valid, parse_pair, parse_port, ParseError};

#[test]
fn parses_a_valid_port() {
    assert_eq!(parse_port("8080"), Ok(8080));
}

#[test]
fn rejects_an_empty_string() {
    assert_eq!(parse_port(""), Err(ParseError::Empty));
    assert_eq!(parse_port("   "), Err(ParseError::Empty));
}

#[test]
fn rejects_something_that_is_not_a_number() {
    assert_eq!(parse_port("http"), Err(ParseError::NotANumber));
}

#[test]
fn finds_the_first_that_parses() {
    assert_eq!(first_valid(&["", "nope", "443", "80"]), Some(443));
}

#[test]
fn parses_a_pair() {
    assert_eq!(parse_pair("80", "443"), Ok((80, 443)));
}
