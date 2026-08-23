// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{count_words_parallel, double_ends, tally_lengths};

#[test]
fn empty_input_spawns_no_trouble() {
    assert_eq!(count_words_parallel(&[], 4), 0);
    assert_eq!(tally_lengths(&[], 4), vec![]);
}

#[test]
fn more_threads_than_texts_clamps() {
    let corpus = vec!["solo".to_string()];
    assert_eq!(count_words_parallel(&corpus, 64), 1);
}

#[test]
fn zero_threads_means_one() {
    let corpus = vec!["a b".to_string()];
    assert_eq!(count_words_parallel(&corpus, 0), 2);
}

#[test]
fn double_ends_edits_through_two_mutable_views() {
    let mut values = [5, 6, 7];
    assert_eq!(double_ends(&mut values), (6, 17));
    assert_eq!(values, [6, 6, 17]);
}

#[test]
fn one_element_is_both_ends() {
    let mut single = [1];
    assert_eq!(double_ends(&mut single), (12, 12));
}

#[test]
fn an_empty_slice_is_calmly_nothing() {
    let mut none: [i32; 0] = [];
    assert_eq!(double_ends(&mut none), (0, 0));
}
