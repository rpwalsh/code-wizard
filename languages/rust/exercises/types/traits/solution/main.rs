// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Behavior shared by name, and the two ways to accept it.

pub trait Priced {
    fn cents(&self) -> u64;

    /// A default: overridable, but correct for anything that has a price.
    fn is_free(&self) -> bool {
        self.cents() == 0
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
        self.cents
    }
}

impl Priced for Subscription {
    fn cents(&self) -> u64 {
        // saturating rather than wrapping: a nonsense subscription length
        // should cost a great deal, not wrap around to almost nothing.
        self.months.saturating_mul(self.monthly_cents)
    }
}

/// Static dispatch: one copy compiled per concrete type.
pub fn total_static<T: Priced>(items: &[T]) -> u64 {
    items.iter().map(Priced::cents).sum()
}

/// Dynamic dispatch: one function, a vtable lookup per call.
pub fn total_dynamic(items: &[Box<dyn Priced>]) -> u64 {
    // The elements are different concrete types, so there is no single T to
    // be generic over. That is exactly when dyn earns its indirection.
    items.iter().map(|item| item.cents()).sum()
}

pub fn cheapest(items: &[Box<dyn Priced>]) -> Option<u64> {
    items.iter().map(|item| item.cents()).min()
}
