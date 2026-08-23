// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Sharing on the compiler's terms: pay only for what the sharing needs.

use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::thread;

pub fn count_words_parallel(texts: &[String], threads: usize) -> usize {
    if texts.is_empty() {
        return 0;
    }
    let workers = threads.clamp(1, texts.len());
    let chunk = (texts.len() + workers - 1) / workers;

    // Nothing is shared, so nothing is locked: scoped threads borrow the
    // slice read-only and the partial counts travel home through join.
    thread::scope(|scope| {
        let mut handles = Vec::new();
        for share in texts.chunks(chunk) {
            handles.push(scope.spawn(move || {
                share
                    .iter()
                    .map(|text| text.split_whitespace().count())
                    .sum::<usize>()
            }));
        }
        handles.into_iter().map(|handle| handle.join().unwrap()).sum()
    })
}

pub fn tally_lengths(texts: &[String], threads: usize) -> Vec<(usize, usize)> {
    let counts: Arc<Mutex<HashMap<usize, usize>>> = Arc::new(Mutex::new(HashMap::new()));
    let workers = threads.clamp(1, texts.len().max(1));
    let chunk = (texts.len().max(1) + workers - 1) / workers;

    thread::scope(|scope| {
        for share in texts.chunks(chunk.max(1)) {
            let counts = Arc::clone(&counts);
            scope.spawn(move || {
                // Count locally, merge once: the lock guards a brief merge,
                // not every increment — or N threads just take turns.
                let mut local: HashMap<usize, usize> = HashMap::new();
                for text in share {
                    *local.entry(text.len()).or_insert(0) += 1;
                }
                let mut shared = counts.lock().unwrap();
                for (length, count) in local {
                    *shared.entry(length).or_insert(0) += count;
                }
            });
        }
    });

    let mut entries: Vec<(usize, usize)> =
        counts.lock().unwrap().iter().map(|(k, v)| (*k, *v)).collect();
    entries.sort_unstable();
    entries
}

pub fn shared_config(name: &str) -> (Rc<String>, Rc<String>, usize) {
    // One allocation, two handles, zero atomics — and Rc being !Send means
    // the compiler itself enforces "one thread only".
    let first = Rc::new(name.to_string());
    let second = Rc::clone(&first);
    let count = Rc::strong_count(&first);
    (first, second, count)
}

pub fn double_ends(values: &mut [i32]) -> (i32, i32) {
    if values.is_empty() {
        return (0, 0);
    }

    // Two simultaneous &mut, legal because the split proves they cannot
    // alias. The one-element case lands both edits on the same value.
    let (front, back) = values.split_at_mut(1);
    front[0] += 1;
    if let Some(last) = back.last_mut() {
        *last += 10;
    } else {
        front[0] += 10;
    }

    (values[0], *values.last().unwrap())
}
