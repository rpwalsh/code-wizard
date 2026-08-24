// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! Traits as bounds, generics over them, and one honest lifetime.

pub struct Rect {
    pub width: f64,
    pub height: f64,
}

pub struct Circle {
    pub radius: f64,
}

pub trait Sized2d {
    fn area(&self) -> f64;

    fn describe(&self) -> String {
        unimplemented!()
    }
}

pub fn total_area(shapes: &[Box<dyn Sized2d>]) -> f64 {
    unimplemented!()
}

pub fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    unimplemented!()
}

pub fn longer<'a>(left: &'a str, right: &'a str) -> &'a str {
    unimplemented!()
}
