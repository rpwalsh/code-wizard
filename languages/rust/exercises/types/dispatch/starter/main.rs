// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Behavior shared by name, and the two ways to accept it.

pub trait Priced {
    fn cents(&self) -> u64;

    /// A default: overridable, but correct for anything that has a price.
    fn is_free(&self) -> bool {
        unimplemented!()
    }
}

pub struct Book {
    pub title: String,
    pub cents: u64,
}

pub struct Subscription {
    pub months: u64,
    pub monthly_cents: u64,
}

impl Priced for Book {
    fn cents(&self) -> u64 {
        unimplemented!()
    }
}

impl Priced for Subscription {
    fn cents(&self) -> u64 {
        unimplemented!()
    }
}

/// Static dispatch: one copy compiled per concrete type.
pub fn total_static<T: Priced>(items: &[T]) -> u64 {
    unimplemented!()
}

/// Dynamic dispatch: one function, a vtable lookup per call.
pub fn total_dynamic(items: &[Box<dyn Priced>]) -> u64 {
    unimplemented!()
}

pub fn cheapest(items: &[Box<dyn Priced>]) -> Option<u64> {
    unimplemented!()
}
