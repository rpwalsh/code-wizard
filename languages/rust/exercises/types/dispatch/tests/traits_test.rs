// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{cheapest, total_dynamic, total_static, Book, Priced, Subscription};

fn book(cents: u64) -> Book {
    Book { title: String::from("a"), cents }
}

#[test]
fn a_book_costs_what_it_says() {
    assert_eq!(book(1200).cents(), 1200);
}

#[test]
fn a_subscription_multiplies_out() {
    let sub = Subscription { months: 12, monthly_cents: 500 };
    assert_eq!(sub.cents(), 6000);
}

#[test]
fn the_default_method_works_for_both() {
    assert!(book(0).is_free());
    assert!(!book(1).is_free());
    assert!(Subscription { months: 3, monthly_cents: 0 }.is_free());
}

#[test]
fn static_dispatch_sums_one_concrete_type() {
    let books = vec![book(100), book(250)];
    assert_eq!(total_static(&books), 350);
}

#[test]
fn dynamic_dispatch_sums_a_mixed_collection() {
    let items: Vec<Box<dyn Priced>> = vec![
        Box::new(book(100)),
        Box::new(Subscription { months: 2, monthly_cents: 300 }),
    ];
    assert_eq!(total_dynamic(&items), 700);
}

#[test]
fn cheapest_finds_the_smallest() {
    let items: Vec<Box<dyn Priced>> = vec![
        Box::new(book(900)),
        Box::new(Subscription { months: 1, monthly_cents: 250 }),
    ];
    assert_eq!(cheapest(&items), Some(250));
}
