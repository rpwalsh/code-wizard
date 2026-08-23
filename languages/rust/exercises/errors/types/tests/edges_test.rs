// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{exit_code, get_port, parse_number, ConfigError};

fn pairs(entries: &[(&str, &str)]) -> Vec<(String, String)> {
    entries
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}

#[test]
fn zero_and_the_top_of_the_range() {
    assert!(matches!(
        get_port(&pairs(&[("port", "0")])),
        Err(ConfigError::OutOfRange { .. })
    ));
    assert_eq!(get_port(&pairs(&[("port", "65535")])), Ok(65535));
    assert_eq!(get_port(&pairs(&[("port", "1")])), Ok(1));
}

#[test]
fn whitespace_is_tolerated_garbage_is_not() {
    assert_eq!(get_port(&pairs(&[("port", " 8080 ")])), Ok(8080));
    assert!(matches!(
        get_port(&pairs(&[("port", "80a")])),
        Err(ConfigError::NotANumber { .. })
    ));
}

#[test]
fn parse_number_carries_the_context_from_ignores_it() {
    // The error knows the key and the offending text — context the
    // underlying ParseIntError never had, added at the boundary.
    let err = parse_number("retries", "many").unwrap_err();
    assert_eq!(err.to_string(), "retries is not a number: many");
}

#[test]
fn negative_ports_are_out_of_range_not_unparseable() {
    assert!(matches!(
        get_port(&pairs(&[("port", "-1")])),
        Err(ConfigError::OutOfRange { .. })
    ));
}

#[test]
fn the_first_port_key_wins() {
    assert_eq!(
        get_port(&pairs(&[("port", "80"), ("port", "90")])),
        Ok(80)
    );
}

#[test]
fn all_codes_are_distinct() {
    let codes = [
        exit_code(&Ok(1)),
        exit_code(&Err(ConfigError::Missing { key: "k".into() })),
        exit_code(&Err(ConfigError::NotANumber {
            key: "k".into(),
            value: "v".into(),
        })),
        exit_code(&Err(ConfigError::OutOfRange {
            key: "k".into(),
            value: 9,
            low: 1,
            high: 5,
        })),
    ];
    let unique: std::collections::HashSet<_> = codes.iter().collect();
    assert_eq!(unique.len(), codes.len());
}
