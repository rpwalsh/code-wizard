// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{largest, longer, total_area};

#[test]
fn an_empty_slice_has_no_largest() {
    let nothing: [i32; 0] = [];
    assert_eq!(largest(&nothing), None);
}

#[test]
fn largest_handles_floats_where_ord_could_not() {
    // f64 is only PartialOrd — a stricter bound would refuse this call.
    assert_eq!(largest(&[1.5, 0.5, 2.5]), Some(&2.5));
}

#[test]
fn an_empty_bag_of_shapes_sums_to_zero() {
    assert_eq!(total_area(&[]), 0.0);
}

#[test]
fn the_lifetime_lets_the_result_outlive_the_call() {
    // Both inputs live to the end of the function, so keeping the result
    // is fine — this compiling IS the lifetime working.
    let a = String::from("long enough");
    let b = String::from("short");
    let kept = longer(&a, &b);
    assert_eq!(kept, "long enough");
    // The version that must NOT compile (and does not):
    // let kept; { let b = String::from("short"); kept = longer(&a, &b); }
    // println!("{kept}"); — b died while kept still borrowed from the call.
}

#[test]
fn largest_returns_a_reference_into_the_slice() {
    let items = [10, 30, 20];
    let best = largest(&items).unwrap();
    assert!(std::ptr::eq(best, &items[1]));
}
