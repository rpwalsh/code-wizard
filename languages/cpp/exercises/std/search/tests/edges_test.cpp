// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(nothing_is_in_an_empty_vector, "cpp.std.search") {
    const std::vector<int> none;
    RETRAINER_ASSERT(!contains(none, 1), "nothing contains anything");
    RETRAINER_ASSERT_INT(insertion_point(none, 1), 0);
    RETRAINER_ASSERT_INT(count_of(none, 1), 0);
    RETRAINER_ASSERT(!first_at_least(none, 1).has_value(), "and nothing is at least anything");
}

RETRAINER_TEST(inserting_into_an_empty_vector_works, "cpp.std.search") {
    std::vector<int> sorted;
    insert_sorted(sorted, 4);
    RETRAINER_ASSERT_INT((int)sorted.size(), 1);
    if (sorted.empty()) return;
    RETRAINER_ASSERT_INT(sorted[0], 4);
}

RETRAINER_TEST(nothing_is_at_least_more_than_the_largest, "cpp.std.search") {
    // lower_bound returns end() here, which is a position and not a value.
    // Reading through it is the commonest way to misuse these functions.
    const std::vector<int> sorted{1, 2, 3};
    RETRAINER_ASSERT(!first_at_least(sorted, 4).has_value(), "nothing is that large");
    RETRAINER_ASSERT_INT(insertion_point(sorted, 4), 3);
}

RETRAINER_TEST(everything_is_at_least_less_than_the_smallest, "cpp.std.search") {
    const std::vector<int> sorted{5, 6, 7};
    const std::optional<int> found = first_at_least(sorted, 0);
    RETRAINER_ASSERT(found.has_value(), "the first one qualifies");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 5);
}

RETRAINER_TEST(the_insertion_point_of_a_repeat_is_before_its_equals, "cpp.std.search") {
    // Before, not after. Which end you land on is the difference between
    // lower_bound and upper_bound, and it decides whether an insert is stable.
    const std::vector<int> sorted{1, 2, 2, 2, 5};
    RETRAINER_ASSERT_INT(insertion_point(sorted, 2), 1);
    RETRAINER_ASSERT_INT(insertion_point(sorted, 5), 4);
}

RETRAINER_TEST(inserting_a_repeat_keeps_them_together, "cpp.std.search") {
    std::vector<int> sorted{1, 2, 2, 5};
    insert_sorted(sorted, 2);

    RETRAINER_ASSERT_INT((int)sorted.size(), 5);
    if (sorted.size() < 5) return;
    RETRAINER_ASSERT_INT(sorted[0], 1);
    RETRAINER_ASSERT_INT(sorted[1], 2);
    RETRAINER_ASSERT_INT(sorted[3], 2);
    RETRAINER_ASSERT_INT(sorted[4], 5);
}

RETRAINER_TEST(inserting_below_everything_goes_first, "cpp.std.search") {
    std::vector<int> sorted{5, 6};
    insert_sorted(sorted, 1);
    RETRAINER_ASSERT_INT((int)sorted.size(), 3);
    if (sorted.empty()) return;
    RETRAINER_ASSERT_INT(sorted[0], 1);
}

RETRAINER_TEST(inserting_above_everything_goes_last, "cpp.std.search") {
    std::vector<int> sorted{5, 6};
    insert_sorted(sorted, 9);
    RETRAINER_ASSERT_INT((int)sorted.size(), 3);
    if (sorted.size() < 3) return;
    RETRAINER_ASSERT_INT(sorted[2], 9);
}

RETRAINER_TEST(a_vector_of_one_behaves, "cpp.std.search") {
    const std::vector<int> one{5};
    RETRAINER_ASSERT(contains(one, 5), "the only value is there");
    RETRAINER_ASSERT(!contains(one, 4), "and nothing else is");
    RETRAINER_ASSERT_INT(insertion_point(one, 4), 0);
    RETRAINER_ASSERT_INT(insertion_point(one, 6), 1);
    RETRAINER_ASSERT_INT(count_of(one, 5), 1);
}

RETRAINER_TEST(a_vector_that_is_all_one_value_counts_them_all, "cpp.std.search") {
    const std::vector<int> same{7, 7, 7, 7};
    RETRAINER_ASSERT_INT(count_of(same, 7), 4);
    RETRAINER_ASSERT_INT(insertion_point(same, 7), 0);
    RETRAINER_ASSERT(contains(same, 7), "seven is certainly there");
}

RETRAINER_TEST(negative_values_are_searched_like_any_other, "cpp.std.search") {
    const std::vector<int> sorted{-9, -4, 0, 3};
    RETRAINER_ASSERT(contains(sorted, -4), "minus four is there");
    RETRAINER_ASSERT_INT(insertion_point(sorted, -5), 1);
    RETRAINER_ASSERT_INT(count_of(sorted, 0), 1);

    const std::optional<int> found = first_at_least(sorted, -6);
    RETRAINER_ASSERT(found.has_value(), "minus four qualifies");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), -4);
}

RETRAINER_TEST(repeated_inserts_build_a_sorted_vector, "cpp.std.search") {
    std::vector<int> sorted;
    const int values[] = {5, 1, 9, 3, 7, 1};
    for (const int value : values) {
        insert_sorted(sorted, value);
    }

    RETRAINER_ASSERT_INT((int)sorted.size(), 6);
    if (sorted.size() < 6) return;
    RETRAINER_ASSERT_INT(sorted[0], 1);
    RETRAINER_ASSERT_INT(sorted[1], 1);
    RETRAINER_ASSERT_INT(sorted[2], 3);
    RETRAINER_ASSERT_INT(sorted[5], 9);
}
