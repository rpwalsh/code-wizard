// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[derive(Debug, PartialEq)]
pub enum ParseError {
    // TODO
}

pub fn parse_port(text: &str) -> Result<u16, ParseError> {
    todo!()
}

pub fn first_valid(inputs: &[&str]) -> Option<u16> {
    todo!()
}

pub fn parse_pair(a: &str, b: &str) -> Result<(u16, u16), ParseError> {
    todo!()
}

fn main() {
    println!("{:?}", parse_port("8080"));
}
