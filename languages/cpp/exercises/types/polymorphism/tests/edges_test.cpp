// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <memory>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(deleting_through_a_base_pointer_runs_the_derived_destructor,
               "cpp.lifetime.rule") {
    // The bug this catches is silent and enormous: without a virtual
    // destructor the derived part is never destroyed, so every member it owns
    // leaks, and nothing anywhere reports a problem.
    Circle::reset_destroyed();
    {
        const std::unique_ptr<Shape> shape = std::make_unique<Circle>(1.0);
    }
    RETRAINER_ASSERT_INT(Circle::destroyed(), 1);
}

RETRAINER_TEST(every_circle_in_a_collection_is_destroyed, "cpp.lifetime.rule") {
    Circle::reset_destroyed();
    {
        std::vector<std::unique_ptr<Shape>> shapes;
        shapes.push_back(std::make_unique<Circle>(1.0));
        shapes.push_back(std::make_unique<Rectangle>(1.0, 1.0));
        shapes.push_back(std::make_unique<Circle>(2.0));
    }
    RETRAINER_ASSERT_INT(Circle::destroyed(), 2);
}

RETRAINER_TEST(no_shapes_have_no_area_and_no_largest, "cpp.types.polymorphism") {
    const std::vector<std::unique_ptr<Shape>> none;
    RETRAINER_ASSERT_NEAR(total_area(none), 0.0, 1e-9);
    RETRAINER_ASSERT(largest(none) == nullptr, "nothing is the largest of nothing");
    RETRAINER_ASSERT_INT(count_circles(none), 0);
}

RETRAINER_TEST(a_tie_leaves_the_first_shape_in_place, "cpp.types.polymorphism") {
    // Two shapes of equal area. Picking the later one is not wrong so much as
    // unpredictable, and unpredictable is what makes a bug hard to find.
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Square>(2.0));       // 4
    shapes.push_back(std::make_unique<Rectangle>(1.0, 4.0));  // also 4

    const Shape *biggest = largest(shapes);
    RETRAINER_ASSERT(biggest != nullptr, "there is a largest");
    if (biggest == nullptr) return;
    RETRAINER_ASSERT_STR(biggest->name(), "square");
}

RETRAINER_TEST(a_square_is_not_counted_as_a_circle, "cpp.types.polymorphism") {
    // dynamic_cast asks about the real type, not a convenient one.
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Square>(1.0));
    shapes.push_back(std::make_unique<Rectangle>(1.0, 1.0));
    RETRAINER_ASSERT_INT(count_circles(shapes), 0);
}

RETRAINER_TEST(a_square_held_as_a_shape_still_describes_itself_as_a_square,
               "cpp.types.polymorphism") {
    // Through Shape *, through Rectangle's inheritance, two levels down. The
    // static type of the pointer decides nothing.
    const std::unique_ptr<Shape> shape = std::make_unique<Square>(1.0);
    const std::string described = shape->describe();
    RETRAINER_ASSERT_STR(described.c_str(), "a square, which is also a rectangle");
}

RETRAINER_TEST(a_rectangle_of_zero_width_has_no_area, "cpp.types.polymorphism") {
    const Rectangle flat(0.0, 5.0);
    RETRAINER_ASSERT_NEAR(flat.area(), 0.0, 1e-9);
}

RETRAINER_TEST(one_shape_is_its_own_total_and_its_own_largest, "cpp.types.polymorphism") {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(3.0));
    RETRAINER_ASSERT_NEAR(total_area(shapes), kPi * 9.0, 1e-9);
    const Shape *biggest = largest(shapes);
    RETRAINER_ASSERT(biggest != nullptr, "the only shape is the largest");
    if (biggest == nullptr) return;
    RETRAINER_ASSERT_NEAR(biggest->area(), kPi * 9.0, 1e-9);
}
