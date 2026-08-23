// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! A transfer's lifecycle as a sum type: the illegal states do not compile.

/// The states a transfer can be in. Each carries exactly what it knows.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Transfer {
    Queued,
    Running { percent: u8 },
    Done { bytes: u64 },
    Failed { reason: String },
}

pub fn describe(transfer: &Transfer) -> String {
    unimplemented!()
}

pub fn advance(transfer: Transfer, step: u8) -> Transfer {
    unimplemented!()
}

pub fn first_failure(transfers: &[Transfer]) -> Option<&str> {
    unimplemented!()
}

pub fn tally(transfers: &[Transfer]) -> (usize, usize, usize, usize) {
    unimplemented!()
}
