// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{exit_code, get_port, ConfigError};

fn pairs(entries: &[(&str, &str)]) -> Vec<(String, String)> {
    entries
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}

#[test]
fn a_good_port_parses() {
    assert_eq!(get_port(&pairs(&[("port", "8080")])), Ok(8080));
}

#[test]
fn each_failure_gets_its_variant() {
    assert_eq!(
        get_port(&pairs(&[("host", "x")])),
        Err(ConfigError::Missing { key: "port".to_string() })
    );
    assert_eq!(
        get_port(&pairs(&[("port", "eighty")])),
        Err(ConfigError::NotANumber {
            key: "port".to_string(),
            value: "eighty".to_string()
        })
    );
    assert_eq!(
        get_port(&pairs(&[("port", "70000")])),
        Err(ConfigError::OutOfRange {
            key: "port".to_string(),
            value: 70000,
            low: 1,
            high: 65535
        })
    );
}

#[test]
fn display_speaks_to_humans() {
    let missing = ConfigError::Missing { key: "port".to_string() };
    assert_eq!(missing.to_string(), "missing key: port");

    let bad = ConfigError::NotANumber {
        key: "port".to_string(),
        value: "eighty".to_string(),
    };
    assert_eq!(bad.to_string(), "port is not a number: eighty");
}

#[test]
fn the_boundary_flattens_to_codes() {
    assert_eq!(exit_code(&Ok(80)), 0);
    assert_eq!(
        exit_code(&Err(ConfigError::Missing { key: "port".to_string() })),
        2
    );
}
