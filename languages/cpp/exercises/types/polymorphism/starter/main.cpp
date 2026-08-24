// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

namespace {
int circles_destroyed = 0;
}  // namespace

Shape::~Shape() = default;

std::string Shape::describe() const {
    return "";
}

Rectangle::Rectangle(double width, double height) : width_(width), height_(height) {
}

double Rectangle::area() const {
    return 0.0;
}

std::string Rectangle::name() const {
    return "";
}

Square::Square(double side) : Rectangle(side, side) {
}

std::string Square::name() const {
    return "";
}

std::string Square::describe() const {
    return "";
}

Circle::Circle(double radius) : radius_(radius) {
}

Circle::~Circle() {
    // Count this one.
}

double Circle::area() const {
    return 0.0;
}

std::string Circle::name() const {
    return "";
}

int Circle::destroyed() {
    return circles_destroyed;
}

void Circle::reset_destroyed() {
    circles_destroyed = 0;
}

double total_area(const std::vector<std::unique_ptr<Shape>> &shapes) {
    (void)shapes;
    return 0.0;
}

const Shape *largest(const std::vector<std::unique_ptr<Shape>> &shapes) {
    (void)shapes;
    return nullptr;
}

int count_circles(const std::vector<std::unique_ptr<Shape>> &shapes) {
    (void)shapes;
    return 0;
}
