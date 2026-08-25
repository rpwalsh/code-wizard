// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <array>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(one_function_serves_every_kind_of_storage, "cpp.std.spans") {
    // A vector, a std::array and a plain C array, through one function that
    // is not a template and copies none of them.
    const std::vector<int> from_vector{1, 2, 3};
    const std::array<int, 3> from_array{1, 2, 3};
    const int from_c_array[] = {1, 2, 3};

    RETRAINER_ASSERT_INT(total(from_vector), 6);
    RETRAINER_ASSERT_INT(total(from_array), 6);
    RETRAINER_ASSERT_INT(total(from_c_array), 6);
}

RETRAINER_TEST(the_largest_value_is_found, "cpp.std.spans") {
    const std::vector<int> values{4, 9, 2};
    const std::optional<int> found = largest(values);
    RETRAINER_ASSERT(found.has_value(), "there is a largest");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 9);
}

RETRAINER_TEST(doubling_reaches_the_callers_own_values, "cpp.std.spans") {
    // The test a copy cannot pass. A span<int> is a window onto the caller's
    // storage, so writing through it writes there.
    std::vector<int> values{1, 2, 3};
    double_all(values);

    RETRAINER_ASSERT_INT(values[0], 2);
    RETRAINER_ASSERT_INT(values[1], 4);
    RETRAINER_ASSERT_INT(values[2], 6);
}

RETRAINER_TEST(taking_the_front_gives_that_many, "cpp.std.spans") {
    const std::vector<int> values{1, 2, 3, 4, 5};
    const std::span<const int> front = take(values, 2);

    RETRAINER_ASSERT_INT((int)front.size(), 2);
    if (front.size() < 2) return;
    RETRAINER_ASSERT_INT(front[0], 1);
    RETRAINER_ASSERT_INT(front[1], 2);
}

RETRAINER_TEST(dropping_the_front_leaves_the_rest, "cpp.std.spans") {
    const std::vector<int> values{1, 2, 3, 4, 5};
    const std::span<const int> rest = drop(values, 2);

    RETRAINER_ASSERT_INT((int)rest.size(), 3);
    if (rest.size() < 3) return;
    RETRAINER_ASSERT_INT(rest[0], 3);
    RETRAINER_ASSERT_INT(rest[2], 5);
}

RETRAINER_TEST(a_subspan_points_into_the_original, "cpp.std.spans") {
    // Nothing is copied. The window moves; the values stay where they were.
    const std::vector<int> values{1, 2, 3, 4, 5};
    const std::span<const int> rest = drop(values, 2);
    RETRAINER_ASSERT(rest.data() == values.data() + 2, "the same storage, further along");
}
