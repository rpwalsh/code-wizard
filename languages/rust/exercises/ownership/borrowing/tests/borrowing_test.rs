// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{longest, starting_with, total_length};

#[test]
fn finds_the_longest_name() {
    let names = vec![String::from("ada"), String::from("grace"), String::from("bo")];
    assert_eq!(longest(&names), Some("grace"));
}

#[test]
fn sums_the_lengths() {
    let names = vec![String::from("ada"), String::from("bo")];
    assert_eq!(total_length(&names), 5);
}

#[test]
fn filters_by_prefix() {
    let names = vec![String::from("alpha"), String::from("beta"), String::from("alto")];
    assert_eq!(starting_with(&names, "al"), vec!["alpha", "alto"]);
}

#[test]
fn the_caller_keeps_their_vector() {
    let names = vec![String::from("ada"), String::from("grace")];
    let _ = longest(&names);
    let _ = total_length(&names);
    // Still usable: nothing above took ownership.
    assert_eq!(names.len(), 2);
}
