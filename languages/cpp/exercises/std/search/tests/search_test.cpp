// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_value_that_is_there_is_found, "cpp.std.search") {
    const std::vector<int> sorted{1, 3, 5, 7, 9};
    RETRAINER_ASSERT(contains(sorted, 5), "five is in the middle");
    RETRAINER_ASSERT(contains(sorted, 1), "one is at the front");
    RETRAINER_ASSERT(contains(sorted, 9), "nine is at the back");
}

RETRAINER_TEST(a_value_that_is_not_there_is_not_found, "cpp.std.search") {
    const std::vector<int> sorted{1, 3, 5, 7, 9};
    RETRAINER_ASSERT(!contains(sorted, 4), "four is between two that are there");
    RETRAINER_ASSERT(!contains(sorted, 0), "zero is below everything");
    RETRAINER_ASSERT(!contains(sorted, 10), "ten is above everything");
}

RETRAINER_TEST(the_insertion_point_keeps_the_order, "cpp.std.search") {
    const std::vector<int> sorted{1, 3, 5, 7};
    RETRAINER_ASSERT_INT(insertion_point(sorted, 0), 0);
    RETRAINER_ASSERT_INT(insertion_point(sorted, 4), 2);
    RETRAINER_ASSERT_INT(insertion_point(sorted, 8), 4);
}

RETRAINER_TEST(repeats_are_counted, "cpp.std.search") {
    const std::vector<int> sorted{1, 2, 2, 2, 5};
    RETRAINER_ASSERT_INT(count_of(sorted, 2), 3);
    RETRAINER_ASSERT_INT(count_of(sorted, 1), 1);
    RETRAINER_ASSERT_INT(count_of(sorted, 4), 0);
}

RETRAINER_TEST(the_first_value_at_least_as_large_is_found, "cpp.std.search") {
    const std::vector<int> sorted{10, 20, 30};
    const std::optional<int> found = first_at_least(sorted, 15);
    RETRAINER_ASSERT(found.has_value(), "twenty is at least fifteen");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 20);
}

RETRAINER_TEST(at_least_includes_equal, "cpp.std.search") {
    const std::vector<int> sorted{10, 20, 30};
    const std::optional<int> found = first_at_least(sorted, 20);
    RETRAINER_ASSERT(found.has_value(), "twenty is at least twenty");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 20);
}

RETRAINER_TEST(inserting_keeps_the_vector_sorted, "cpp.std.search") {
    std::vector<int> sorted{1, 3, 7};
    insert_sorted(sorted, 5);

    RETRAINER_ASSERT_INT((int)sorted.size(), 4);
    if (sorted.size() < 4) return;
    RETRAINER_ASSERT_INT(sorted[0], 1);
    RETRAINER_ASSERT_INT(sorted[1], 3);
    RETRAINER_ASSERT_INT(sorted[2], 5);
    RETRAINER_ASSERT_INT(sorted[3], 7);
}
