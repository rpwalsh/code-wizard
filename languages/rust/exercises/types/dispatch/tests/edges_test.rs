// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{cheapest, total_dynamic, total_static, Book, Priced, Subscription};

fn book(cents: u64) -> Book {
    Book { title: String::from("a"), cents }
}

#[test]
fn empty_totals_are_zero_not_none() {
    // A sum has an identity element, so there is nothing to report as
    // missing. A minimum does not, which is why cheapest returns Option.
    let books: Vec<Book> = vec![];
    assert_eq!(total_static(&books), 0);

    let items: Vec<Box<dyn Priced>> = vec![];
    assert_eq!(total_dynamic(&items), 0);
    assert_eq!(cheapest(&items), None);
}

#[test]
fn a_zero_month_subscription_costs_nothing() {
    assert_eq!(Subscription { months: 0, monthly_cents: 999 }.cents(), 0);
}

#[test]
fn an_absurd_subscription_saturates_rather_than_wrapping() {
    // Wrapping multiplication would make the most expensive possible
    // subscription cost almost nothing, which is the wrong way to be wrong.
    let sub = Subscription { months: u64::MAX, monthly_cents: 2 };
    assert_eq!(sub.cents(), u64::MAX);
}

#[test]
fn free_items_are_still_counted_as_items() {
    let items: Vec<Box<dyn Priced>> = vec![Box::new(book(0)), Box::new(book(500))];
    assert_eq!(cheapest(&items), Some(0));
    assert_eq!(total_dynamic(&items), 500);
}

#[test]
fn the_default_can_be_reasoned_about_through_a_trait_object() {
    let item: Box<dyn Priced> = Box::new(book(0));
    assert!(item.is_free());
}

#[test]
fn one_element_is_its_own_cheapest() {
    let items: Vec<Box<dyn Priced>> = vec![Box::new(book(42))];
    assert_eq!(cheapest(&items), Some(42));
    assert_eq!(total_dynamic(&items), 42);
}
