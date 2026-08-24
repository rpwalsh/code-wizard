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

    // Provided once, inherited by every implementor — the Iterator trick
    // at learnable scale.
    fn describe(&self) -> String {
        format!("area {:.1}", self.area())
    }
}

impl Sized2d for Rect {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}

impl Sized2d for Circle {
    fn area(&self) -> f64 {
        3.14159 * self.radius * self.radius
    }
}

pub fn total_area(shapes: &[Box<dyn Sized2d>]) -> f64 {
    // Dynamic dispatch: each element answers with its own area.
    shapes.iter().map(|shape| shape.area()).sum()
}

pub fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    // Only PartialOrd: Ord would turn away f64, Copy would turn away
    // String — callers the body handles fine.
    let mut best: Option<&T> = None;
    for item in items {
        match best {
            None => best = Some(item),
            Some(current) if item > current => best = Some(item),
            _ => {}
        }
    }
    best
}

pub fn longer<'a>(left: &'a str, right: &'a str) -> &'a str {
    // The 'a says: the result lives only while BOTH inputs do, because
    // the caller cannot know which one came back.
    if right.len() > left.len() {
        right
    } else {
        left
    }
}
