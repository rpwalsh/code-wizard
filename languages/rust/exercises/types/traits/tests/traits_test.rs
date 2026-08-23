// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{largest, longer, total_area, Circle, Rect, Sized2d};

#[test]
fn areas_compute_per_shape() {
    assert!((Rect { width: 3.0, height: 4.0 }.area() - 12.0).abs() < 1e-9);
    assert!((Circle { radius: 2.0 }.area() - 12.56636).abs() < 1e-4);
}

#[test]
fn describe_comes_free_with_the_trait() {
    assert_eq!(Rect { width: 5.0, height: 2.5 }.describe(), "area 12.5");
    assert_eq!(Circle { radius: 1.0 }.describe(), "area 3.1");
}

#[test]
fn a_mixed_bag_sums_through_the_trait_object() {
    let shapes: Vec<Box<dyn Sized2d>> = vec![
        Box::new(Rect { width: 2.0, height: 3.0 }),
        Box::new(Circle { radius: 1.0 }),
    ];
    assert!((total_area(&shapes) - 9.14159).abs() < 1e-5);
}

#[test]
fn largest_works_for_numbers_and_strings() {
    assert_eq!(largest(&[3, 9, 4]), Some(&9));
    let words = ["pear".to_string(), "zebra".to_string(), "apple".to_string()];
    assert_eq!(largest(&words), Some(&"zebra".to_string()));
}

#[test]
fn longer_picks_by_length() {
    assert_eq!(longer("hi", "hello"), "hello");
    assert_eq!(longer("first", "tied!"), "first");
}
