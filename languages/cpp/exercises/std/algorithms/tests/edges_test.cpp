// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_range_is_handled_by_every_one, "cpp.std.algorithms") {
    std::vector<Reading> none;

    RETRAINER_ASSERT_INT((int)drop_below(none, 5).size(), 0);
    RETRAINER_ASSERT_INT((int)sensors_of(none).size(), 0);
    RETRAINER_ASSERT(!any_above(none, 0), "nothing is above anything");
    // The identity element, not a special case: an empty sum is zero.
    RETRAINER_ASSERT_INT(total(none), 0);
    RETRAINER_ASSERT_INT((int)sorted_by_temperature(none).size(), 0);
}

RETRAINER_TEST(dropping_everything_leaves_an_empty_vector, "cpp.std.algorithms") {
    std::vector<Reading> readings{{"a", 1}, {"b", 2}};
    auto kept = drop_below(readings, 100);
    RETRAINER_ASSERT_INT((int)kept.size(), 0);
}

RETRAINER_TEST(the_floor_itself_is_kept, "cpp.std.algorithms") {
    // "Below" excludes the boundary. Off by one here silently drops a
    // reading that was exactly at the threshold somebody chose.
    std::vector<Reading> readings{{"a", 10}, {"b", 9}};
    auto kept = drop_below(readings, 10);
    RETRAINER_ASSERT_INT((int)kept.size(), 1);
    RETRAINER_ASSERT_STR(kept[0].sensor.c_str(), "a");
}

RETRAINER_TEST(any_above_excludes_the_ceiling_itself, "cpp.std.algorithms") {
    std::vector<Reading> readings{{"a", 30}};
    RETRAINER_ASSERT(!any_above(readings, 30), "thirty is not above thirty");
    RETRAINER_ASSERT(any_above(readings, 29), "thirty is above twenty-nine");
}

RETRAINER_TEST(equal_temperatures_keep_their_arrival_order, "cpp.std.algorithms") {
    // stable_sort is the difference. Plain sort may reorder equal elements,
    // so a report built on it disagrees with itself between runs.
    std::vector<Reading> readings{{"first", 10}, {"second", 10}, {"third", 10}};
    auto ordered = sorted_by_temperature(readings);

    RETRAINER_ASSERT_STR(ordered[0].sensor.c_str(), "first");
    RETRAINER_ASSERT_STR(ordered[1].sensor.c_str(), "second");
    RETRAINER_ASSERT_STR(ordered[2].sensor.c_str(), "third");
}

RETRAINER_TEST(negative_temperatures_sum_and_sort, "cpp.std.algorithms") {
    std::vector<Reading> readings{{"a", -5}, {"b", 10}, {"c", -20}};
    RETRAINER_ASSERT_INT(total(readings), -15);

    auto ordered = sorted_by_temperature(readings);
    RETRAINER_ASSERT_STR(ordered[0].sensor.c_str(), "c");
    RETRAINER_ASSERT_STR(ordered[2].sensor.c_str(), "b");
}

RETRAINER_TEST(the_caller_vector_is_not_disturbed, "cpp.std.algorithms") {
    // Taken by value, so the original is untouched however much the
    // algorithm rearranges its copy.
    std::vector<Reading> readings{{"a", 3}, {"b", 1}};
    sorted_by_temperature(readings);
    drop_below(readings, 99);

    RETRAINER_ASSERT_INT((int)readings.size(), 2);
    RETRAINER_ASSERT_STR(readings[0].sensor.c_str(), "a");
}
