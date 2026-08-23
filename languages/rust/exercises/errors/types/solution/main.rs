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
        match self {
            ConfigError::Missing { key } => write!(f, "missing key: {key}"),
            ConfigError::NotANumber { key, value } => {
                write!(f, "{key} is not a number: {value}")
            }
            ConfigError::OutOfRange { key, value, low, high } => {
                write!(f, "{key} out of range: {value} (expected {low}..={high})")
            }
        }
    }
}

// The empty impl is real: Error's methods all have defaults, and Display
// plus Debug carry the requirements.
impl std::error::Error for ConfigError {}

pub fn parse_number(key: &str, value: &str) -> Result<i64, ConfigError> {
    // map_err, not From: ParseIntError does not know which key failed,
    // and a From cannot invent context it never had.
    value.trim().parse::<i64>().map_err(|_| ConfigError::NotANumber {
        key: key.to_string(),
        value: value.to_string(),
    })
}

pub fn get_port(pairs: &[(String, String)]) -> Result<u16, ConfigError> {
    let value = pairs
        .iter()
        .find(|(key, _)| key == "port")
        .map(|(_, value)| value.as_str())
        .ok_or(ConfigError::Missing {
            key: "port".to_string(),
        })?;

    let number = parse_number("port", value)?;

    if !(1..=65535).contains(&number) {
        return Err(ConfigError::OutOfRange {
            key: "port".to_string(),
            value: number,
            low: 1,
            high: 65535,
        });
    }
    Ok(number as u16)
}

pub fn exit_code(result: &Result<u16, ConfigError>) -> i32 {
    // The outermost edge: rich types inside, an i32 for the shell. Total,
    // so a new variant breaks this match until it gets a code.
    match result {
        Ok(_) => 0,
        Err(ConfigError::Missing { .. }) => 2,
        Err(ConfigError::NotANumber { .. }) => 3,
        Err(ConfigError::OutOfRange { .. }) => 4,
    }
}
