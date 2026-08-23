// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[derive(Debug, PartialEq)]
pub enum ParseError {
    Empty,
    NotANumber,
    OutOfRange,
}

/// Parses into u32 first, deliberately.
///
/// Parsing straight into u16 would make `70000` a *parse* failure rather than
/// an out-of-range one, and the caller could no longer tell "that is not a
/// number" from "that is not a port".
pub fn parse_port(text: &str) -> Result<u16, ParseError> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err(ParseError::Empty);
    }

    let value: u32 = trimmed.parse().map_err(|_| ParseError::NotANumber)?;
    if value == 0 || value > 65535 {
        return Err(ParseError::OutOfRange);
    }

    Ok(value as u16)
}

/// The reason is discarded on purpose: "none of these parsed" has several
/// reasons and no single one, so the honest type has nowhere to put it.
pub fn first_valid(inputs: &[&str]) -> Option<u16> {
    inputs.iter().find_map(|input| parse_port(input).ok())
}

/// `?` is an early return, which is why this is three lines and not a nested
/// match.
pub fn parse_pair(a: &str, b: &str) -> Result<(u16, u16), ParseError> {
    let first = parse_port(a)?;
    let second = parse_port(b)?;
    Ok((first, second))
}

fn main() {
    println!("{:?}", parse_port("8080"));
}
