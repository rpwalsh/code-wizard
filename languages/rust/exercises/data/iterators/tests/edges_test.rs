// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{best_seller, over_quota, product_totals, revenue, Sale};

fn sale(product: &str, quantity: u32, unit_price: u32) -> Sale {
    Sale { product: product.to_string(), quantity, unit_price }
}

#[test]
fn empty_revenue_is_zero_not_an_option() {
    // A sum has an identity element; that is why the signature is u64.
    assert_eq!(revenue(&[]), 0);
}

#[test]
fn empty_best_seller_is_none() {
    // A maximum has no identity element; that is why this one is an Option.
    assert_eq!(best_seller(&[]), None);
}

#[test]
fn revenue_does_not_overflow_u32() {
    // 100_000 * 50_000 = 5e9, past u32::MAX. Widening after the multiply
    // would already have wrapped.
    let sales = [sale("bulk", 100_000, 50_000)];
    assert_eq!(revenue(&sales), 5_000_000_000);
}

#[test]
fn a_tie_keeps_the_last() {
    // max_by_key's documented rule; min_by_key keeps the first.
    let sales = [sale("first", 5, 1), sale("last", 5, 1)];
    assert_eq!(best_seller(&sales).map(|s| s.product.as_str()), Some("last"));
}

#[test]
fn over_quota_is_strict_and_ordered() {
    let sales = [sale("a", 5, 1), sale("b", 6, 1), sale("c", 9, 1)];
    let picked = over_quota(&sales, 5);
    let names: Vec<&str> = picked.iter().map(|s| s.product.as_str()).collect();
    assert_eq!(names, vec!["b", "c"]);
}

#[test]
fn over_quota_borrows_rather_than_clones() {
    let sales = [sale("a", 9, 1)];
    let picked = over_quota(&sales, 1);
    // The same allocation, not a copy of it.
    assert!(std::ptr::eq(picked[0], &sales[0]));
}

#[test]
fn totals_of_nothing_is_an_empty_map() {
    assert!(product_totals(&[]).is_empty());
}
