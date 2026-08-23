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
    unimplemented!()
}

/// The sale with the greatest quantity; the last such on a tie.
pub fn best_seller(sales: &[Sale]) -> Option<&Sale> {
    unimplemented!()
}

/// Total quantity per product.
pub fn product_totals(sales: &[Sale]) -> HashMap<String, u32> {
    unimplemented!()
}

/// Every sale strictly over the quota, in order, borrowed not cloned.
pub fn over_quota(sales: &[Sale], quota: u32) -> Vec<&Sale> {
    unimplemented!()
}

/// Each sale as "3 x widget @ 250", in order.
pub fn receipt_lines(sales: &[Sale]) -> Vec<String> {
    unimplemented!()
}
