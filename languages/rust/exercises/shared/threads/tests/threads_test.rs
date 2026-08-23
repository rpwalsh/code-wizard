// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{count_words_parallel, shared_config, tally_lengths};

fn texts(entries: &[&str]) -> Vec<String> {
    entries.iter().map(|s| s.to_string()).collect()
}

#[test]
fn words_are_counted_across_threads() {
    let corpus = texts(&["one two three", "four five", "six"]);
    assert_eq!(count_words_parallel(&corpus, 2), 6);
    assert_eq!(count_words_parallel(&corpus, 8), 6);
}

#[test]
fn a_bigger_corpus_agrees_with_the_serial_answer() {
    let corpus: Vec<String> = (0..200).map(|i| format!("word {i} and more")).collect();
    let serial: usize = corpus.iter().map(|t| t.split_whitespace().count()).sum();
    assert_eq!(count_words_parallel(&corpus, 4), serial);
}

#[test]
fn lengths_tally_sorted() {
    let corpus = texts(&["aa", "bbb", "cc", "dddd", "ee"]);
    assert_eq!(tally_lengths(&corpus, 2), vec![(2, 3), (3, 1), (4, 1)]);
}

#[test]
fn rc_shares_one_allocation() {
    let (first, second, count) = shared_config("db.url");
    assert_eq!(count, 2);
    assert_eq!(*first, "db.url");
    // The same allocation, not an equal copy.
    assert!(std::rc::Rc::ptr_eq(&first, &second));
}
