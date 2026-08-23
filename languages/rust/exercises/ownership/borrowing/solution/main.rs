// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/// The longest name, or None when there are none.
///
/// A fold rather than `max_by_key`, because `max_by_key` returns the *last*
/// maximum and the exercise asks for the first.
pub fn longest(names: &[String]) -> Option<&str> {
    names.iter().fold(None::<&str>, |best, name| match best {
        Some(current) if current.len() >= name.len() => Some(current),
        _ => Some(name.as_str()),
    })
}

/// The sum of every name's length. Borrows; allocates nothing.
pub fn total_length(names: &[String]) -> usize {
    names.iter().map(|name| name.len()).sum()
}

/// Every name starting with `prefix`, in order.
///
/// The lifetime says the returned slices borrow from `names` and not from
/// `prefix`, which is what lets the caller drop `prefix` immediately and keep
/// using the result.
pub fn starting_with<'a>(names: &'a [String], prefix: &str) -> Vec<&'a str> {
    names
        .iter()
        .filter(|name| name.starts_with(prefix))
        .map(|name| name.as_str())
        .collect()
}

fn main() {
    let names = vec![String::from("ada"), String::from("grace")];
    println!("{:?}", longest(&names));
}
