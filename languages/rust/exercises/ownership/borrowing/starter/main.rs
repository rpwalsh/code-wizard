// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/// The longest name, or None when there are none.
pub fn longest(names: &[String]) -> Option<&str> {
    todo!()
}

/// The sum of every name's length.
pub fn total_length(names: &[String]) -> usize {
    todo!()
}

/// Every name starting with `prefix`, in order.
pub fn starting_with<'a>(names: &'a [String], prefix: &str) -> Vec<&'a str> {
    todo!()
}

fn main() {
    let names = vec![String::from("ada"), String::from("grace")];
    println!("{:?}", longest(&names));
}
