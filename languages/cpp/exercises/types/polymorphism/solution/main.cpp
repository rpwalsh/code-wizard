// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

namespace {
int circles_destroyed = 0;
}  // namespace

// Out of line and empty on purpose. A base class destroyed through a base
// pointer must be virtual, and defining it in one place keeps the vtable
// here rather than in every translation unit that includes the header.
Shape::~Shape() = default;

std::string Shape::describe() const {
    // Calls name() on the derived object, from a function that has never
    // heard of the derived class. That is the whole mechanism.
    return "a " + name();
}

Rectangle::Rectangle(double width, double height) : width_(width), height_(height) {
}

double Rectangle::area() const {
    return width_ * height_;
}

std::string Rectangle::name() const {
    return "rectangle";
}

Square::Square(double side) : Rectangle(side, side) {
}

std::string Square::name() const {
    return "square";
}

std::string Square::describe() const {
    return "a square, which is also a rectangle";
}

Circle::Circle(double radius) : radius_(radius) {
}

Circle::~Circle() {
    // Only reached through a base pointer because ~Shape is virtual. Were it
    // not, deleting a Circle through a Shape * would run neither this nor the
    // member destructors, and the count below would stay at zero.
    circles_destroyed += 1;
}

double Circle::area() const {
    return kPi * radius_ * radius_;
}

std::string Circle::name() const {
    return "circle";
}

int Circle::destroyed() {
    return circles_destroyed;
}

void Circle::reset_destroyed() {
    circles_destroyed = 0;
}

double total_area(const std::vector<std::unique_ptr<Shape>> &shapes) {
    double sum = 0.0;
    for (const std::unique_ptr<Shape> &shape : shapes) {
        sum += shape->area();
    }
    return sum;
}

const Shape *largest(const std::vector<std::unique_ptr<Shape>> &shapes) {
    const Shape *best = nullptr;
    for (const std::unique_ptr<Shape> &shape : shapes) {
        if (best == nullptr) {
            best = shape.get();
            continue;
        }
        // Strictly greater, so a tie leaves the earlier shape in place. A
        // rule that picks arbitrarily among equals is a rule nobody can test.
        if (shape->area() > best->area()) {
            best = shape.get();
        }
    }
    return best;
}

int count_circles(const std::vector<std::unique_ptr<Shape>> &shapes) {
    int found = 0;
    for (const std::unique_ptr<Shape> &shape : shapes) {
        // dynamic_cast is the question "is it really one of these", answered
        // at run time. A null result is the answer no, not a failure.
        if (dynamic_cast<const Circle *>(shape.get()) != nullptr) {
            found += 1;
        }
    }
    return found;
}
