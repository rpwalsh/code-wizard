// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{longest, starting_with, total_length};

#[test]
fn an_empty_slice_has_no_longest() {
    let names: Vec<String> = Vec::new();
    assert_eq!(longest(&names), None);
}

#[test]
fn an_empty_slice_totals_zero() {
    let names: Vec<String> = Vec::new();
    assert_eq!(total_length(&names), 0);
}

#[test]
fn a_tie_keeps_the_first() {
    // max_by_key would return "bob" here, which is why this case exists.
    let names = vec![String::from("ada"), String::from("bob")];
    assert_eq!(longest(&names), Some("ada"));
}

#[test]
fn an_empty_prefix_matches_everything() {
    let names = vec![String::from("a"), String::from("b")];
    assert_eq!(starting_with(&names, ""), vec!["a", "b"]);
}

#[test]
fn no_match_is_an_empty_vec() {
    let names = vec![String::from("a")];
    assert!(starting_with(&names, "z").is_empty());
}
