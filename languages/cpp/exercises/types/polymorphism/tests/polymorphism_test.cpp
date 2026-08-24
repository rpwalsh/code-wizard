// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <memory>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
std::vector<std::unique_ptr<Shape>> sample() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Rectangle>(2.0, 3.0));  // 6
    shapes.push_back(std::make_unique<Circle>(1.0));          // about 3.14
    shapes.push_back(std::make_unique<Square>(4.0));          // 16
    return shapes;
}
}  // namespace

RETRAINER_TEST(each_shape_computes_its_own_area, "cpp.types.polymorphism") {
    const Rectangle rectangle(2.0, 3.0);
    const Circle circle(2.0);
    const Square square(5.0);

    RETRAINER_ASSERT_NEAR(rectangle.area(), 6.0, 1e-9);
    RETRAINER_ASSERT_NEAR(circle.area(), kPi * 4.0, 1e-9);
    RETRAINER_ASSERT_NEAR(square.area(), 25.0, 1e-9);
}

RETRAINER_TEST(a_square_reuses_the_area_it_inherited, "cpp.types.polymorphism") {
    // Square writes no area() of its own. It passes the same side twice to
    // the base and the arithmetic it needs is already there.
    const Square square(3.0);
    RETRAINER_ASSERT_NEAR(square.area(), 9.0, 1e-9);
    RETRAINER_ASSERT_STR(square.name(), "square");
}

RETRAINER_TEST(the_base_description_asks_the_derived_object_its_name, "cpp.types.polymorphism") {
    const Circle circle(1.0);
    const std::string described = circle.describe();
    RETRAINER_ASSERT_STR(described.c_str(), "a circle");
}

RETRAINER_TEST(a_shape_can_override_the_description_it_was_given, "cpp.types.polymorphism") {
    const Square square(1.0);
    const std::string described = square.describe();
    RETRAINER_ASSERT_STR(described.c_str(), "a square, which is also a rectangle");
}

RETRAINER_TEST(areas_add_up_through_base_pointers, "cpp.types.polymorphism") {
    const std::vector<std::unique_ptr<Shape>> shapes = sample();
    RETRAINER_ASSERT_NEAR(total_area(shapes), 6.0 + kPi + 16.0, 1e-9);
}

RETRAINER_TEST(the_largest_shape_is_found, "cpp.types.polymorphism") {
    const std::vector<std::unique_ptr<Shape>> shapes = sample();
    const Shape *biggest = largest(shapes);
    RETRAINER_ASSERT(biggest != nullptr, "three shapes have a largest");
    if (biggest == nullptr) return;
    RETRAINER_ASSERT_STR(biggest->name(), "square");
}

RETRAINER_TEST(circles_can_be_counted_among_shapes, "cpp.types.polymorphism") {
    const std::vector<std::unique_ptr<Shape>> shapes = sample();
    RETRAINER_ASSERT_INT(count_circles(shapes), 1);
}
