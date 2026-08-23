// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{best_seller, product_totals, receipt_lines, revenue, Sale};

fn sale(product: &str, quantity: u32, unit_price: u32) -> Sale {
    Sale { product: product.to_string(), quantity, unit_price }
}

#[test]
fn revenue_multiplies_and_sums() {
    let sales = [sale("widget", 3, 250), sale("gadget", 2, 400)];
    assert_eq!(revenue(&sales), 3 * 250 + 2 * 400);
}

#[test]
fn best_seller_is_the_greatest_quantity() {
    let sales = [sale("a", 2, 10), sale("b", 9, 10), sale("c", 4, 10)];
    assert_eq!(best_seller(&sales).map(|s| s.product.as_str()), Some("b"));
}

#[test]
fn totals_accumulate_per_product() {
    let sales = [sale("a", 2, 10), sale("b", 1, 10), sale("a", 5, 10)];
    let totals = product_totals(&sales);
    assert_eq!(totals.get("a"), Some(&7));
    assert_eq!(totals.get("b"), Some(&1));
    assert_eq!(totals.len(), 2);
}

#[test]
fn receipt_lines_keep_the_order() {
    let sales = [sale("widget", 3, 250), sale("gadget", 1, 400)];
    assert_eq!(
        receipt_lines(&sales),
        vec!["3 x widget @ 250".to_string(), "1 x gadget @ 400".to_string()]
    );
}
