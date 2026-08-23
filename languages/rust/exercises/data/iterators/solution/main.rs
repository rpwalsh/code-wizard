// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Iterator adapters over a sales record. No for-loops; that is the exercise.

use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sale {
    pub product: String,
    pub quantity: u32,
    pub unit_price: u32,
}

/// The sum of quantity times unit price, widened so it cannot overflow.
pub fn revenue(sales: &[Sale]) -> u64 {
    sales
        .iter()
        // Widen *before* multiplying: the product of two u32s is a u32, and
        // widening afterwards would widen a value that has already wrapped.
        .map(|sale| u64::from(sale.quantity) * u64::from(sale.unit_price))
        .sum()
}

/// The sale with the greatest quantity; the last such on a tie.
pub fn best_seller(sales: &[Sale]) -> Option<&Sale> {
    // max_by_key documents the tie rule: the last of equal elements.
    sales.iter().max_by_key(|sale| sale.quantity)
}

/// Total quantity per product.
pub fn product_totals(sales: &[Sale]) -> HashMap<String, u32> {
    sales.iter().fold(HashMap::new(), |mut totals, sale| {
        *totals.entry(sale.product.clone()).or_insert(0) += sale.quantity;
        totals
    })
}

/// Every sale strictly over the quota, in order, borrowed not cloned.
pub fn over_quota(sales: &[Sale], quota: u32) -> Vec<&Sale> {
    sales.iter().filter(|sale| sale.quantity > quota).collect()
}

/// Each sale as "3 x widget @ 250", in order.
pub fn receipt_lines(sales: &[Sale]) -> Vec<String> {
    sales
        .iter()
        .map(|sale| format!("{} x {} @ {}", sale.quantity, sale.product, sale.unit_price))
        .collect()
}
