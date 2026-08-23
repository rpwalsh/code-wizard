// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Sharing on the compiler's terms: pay only for what the sharing needs.

use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::thread;

pub fn count_words_parallel(texts: &[String], threads: usize) -> usize {
    unimplemented!()
}

pub fn tally_lengths(texts: &[String], threads: usize) -> Vec<(usize, usize)> {
    unimplemented!()
}

pub fn shared_config(name: &str) -> (Rc<String>, Rc<String>, usize) {
    unimplemented!()
}

pub fn double_ends(values: &mut [i32]) -> (i32, i32) {
    unimplemented!()
}
