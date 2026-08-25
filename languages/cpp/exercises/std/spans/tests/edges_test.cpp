// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <array>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_span_totals_zero_and_has_no_largest, "cpp.std.spans") {
    const std::vector<int> none;
    RETRAINER_ASSERT_INT(total(none), 0);
    RETRAINER_ASSERT(!largest(none).has_value(), "nothing is the largest of nothing");
}

RETRAINER_TEST(taking_more_than_there_is_gives_all_of_it, "cpp.std.spans") {
    // Clamped rather than undefined. first() past the end is not short, it
    // is a span over memory the caller does not own.
    const std::vector<int> values{1, 2};
    RETRAINER_ASSERT_INT((int)take(values, 50).size(), 2);
}

RETRAINER_TEST(dropping_more_than_there_is_leaves_nothing, "cpp.std.spans") {
    const std::vector<int> values{1, 2};
    RETRAINER_ASSERT_INT((int)drop(values, 50).size(), 0);
    RETRAINER_ASSERT_INT(total(drop(values, 50)), 0);
}

RETRAINER_TEST(taking_or_dropping_nothing_behaves, "cpp.std.spans") {
    const std::vector<int> values{1, 2, 3};
    RETRAINER_ASSERT_INT((int)take(values, 0).size(), 0);
    RETRAINER_ASSERT_INT((int)drop(values, 0).size(), 3);
    RETRAINER_ASSERT_INT((int)take(values, -4).size(), 0);
    RETRAINER_ASSERT_INT((int)drop(values, -4).size(), 3);
}

RETRAINER_TEST(taking_and_dropping_from_an_empty_span_is_fine, "cpp.std.spans") {
    const std::vector<int> none;
    RETRAINER_ASSERT_INT((int)take(none, 3).size(), 0);
    RETRAINER_ASSERT_INT((int)drop(none, 3).size(), 0);
}

RETRAINER_TEST(taking_everything_is_the_whole_span, "cpp.std.spans") {
    const std::vector<int> values{1, 2, 3};
    const std::span<const int> all = take(values, 3);
    RETRAINER_ASSERT_INT((int)all.size(), 3);
    RETRAINER_ASSERT(all.data() == values.data(), "starting at the same place");
}

RETRAINER_TEST(the_front_of_a_span_points_at_the_front_of_the_storage,
               "cpp.std.spans") {
    const std::vector<int> values{9, 8, 7};
    RETRAINER_ASSERT(take(values, 2).data() == values.data(), "no copy taken");
}

RETRAINER_TEST(doubling_an_empty_span_does_nothing, "cpp.std.spans") {
    std::vector<int> none;
    double_all(none);
    RETRAINER_ASSERT_INT((int)none.size(), 0);
}

RETRAINER_TEST(doubling_reaches_part_of_a_vector, "cpp.std.spans") {
    // A span over a slice, written through. The rest of the vector is
    // untouched, which is the point of handing out a window rather than the
    // whole container.
    std::vector<int> values{1, 2, 3, 4};
    double_all(std::span<int>(values).subspan(1, 2));

    RETRAINER_ASSERT_INT(values[0], 1);
    RETRAINER_ASSERT_INT(values[1], 4);
    RETRAINER_ASSERT_INT(values[2], 6);
    RETRAINER_ASSERT_INT(values[3], 4);
}

RETRAINER_TEST(doubling_works_on_a_plain_array_too, "cpp.std.spans") {
    int values[] = {3, 4};
    double_all(values);
    RETRAINER_ASSERT_INT(values[0], 6);
    RETRAINER_ASSERT_INT(values[1], 8);
}

RETRAINER_TEST(negatives_and_zero_total_correctly, "cpp.std.spans") {
    const std::vector<int> values{-5, 0, 5};
    RETRAINER_ASSERT_INT(total(values), 0);

    const std::optional<int> found = largest(values);
    RETRAINER_ASSERT(found.has_value(), "there is a largest");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 5);
}

RETRAINER_TEST(the_largest_of_all_negatives_is_the_least_negative,
               "cpp.std.spans") {
    // Starting the search at zero instead of at the first element would
    // report zero here, which is not in the data at all.
    const std::vector<int> values{-9, -2, -7};
    const std::optional<int> found = largest(values);
    RETRAINER_ASSERT(found.has_value(), "there is a largest");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), -2);
}

RETRAINER_TEST(take_and_drop_compose_into_a_middle_slice, "cpp.std.spans") {
    const std::vector<int> values{1, 2, 3, 4, 5};
    const std::span<const int> middle = take(drop(values, 1), 3);
    RETRAINER_ASSERT_INT((int)middle.size(), 3);
    if (middle.size() < 3) return;
    RETRAINER_ASSERT_INT(middle[0], 2);
    RETRAINER_ASSERT_INT(middle[2], 4);
    RETRAINER_ASSERT_INT(total(middle), 9);
}

RETRAINER_TEST(taking_one_takes_exactly_one, "cpp.std.spans") {
    // The smallest real request. A guard that rejects one along with zero
    // looks almost right and is wrong on the commonest slice there is.
    const std::vector<int> values{7, 8, 9};
    const std::span<const int> front = take(values, 1);
    RETRAINER_ASSERT_INT((int)front.size(), 1);
    if (front.empty()) return;
    RETRAINER_ASSERT_INT(front[0], 7);
}

RETRAINER_TEST(dropping_one_drops_exactly_one, "cpp.std.spans") {
    const std::vector<int> values{7, 8, 9};
    const std::span<const int> rest = drop(values, 1);
    RETRAINER_ASSERT_INT((int)rest.size(), 2);
    if (rest.size() < 2) return;
    RETRAINER_ASSERT_INT(rest[0], 8);
}
