// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! A config error with a variant per reaction, and the boundary that
//! flattens it.

use std::fmt;

#[derive(Debug, PartialEq, Eq)]
pub enum ConfigError {
    Missing { key: String },
    NotANumber { key: String, value: String },
    OutOfRange { key: String, value: i64, low: i64, high: i64 },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        unimplemented!()
    }
}

impl std::error::Error for ConfigError {}

pub fn parse_number(key: &str, value: &str) -> Result<i64, ConfigError> {
    unimplemented!()
}

pub fn get_port(pairs: &[(String, String)]) -> Result<u16, ConfigError> {
    unimplemented!()
}

pub fn exit_code(result: &Result<u16, ConfigError>) -> i32 {
    unimplemented!()
}
