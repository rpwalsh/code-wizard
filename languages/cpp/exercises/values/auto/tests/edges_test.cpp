// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <map>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(the_pointer_returned_points_into_the_vector, "cpp.values.auto") {
    // The test that a copy cannot pass. If the loop bound `auto` instead of
    // `const auto &`, the address returned would belong to a loop variable
    // that stopped existing on the way out of the function.
    std::vector<Reading> readings;
    readings.reserve(2);
    readings.push_back(Reading("north", 1));
    readings.push_back(Reading("south", 99));

    const Reading *found = first_above(readings, 50);
    RETRAINER_ASSERT(found != nullptr, "ninety nine is above fifty");
    if (found == nullptr) return;
    RETRAINER_ASSERT(found == &readings[1], "it is that element, not a copy of it");
}

RETRAINER_TEST(searching_copies_nothing_either, "cpp.values.auto") {
    std::vector<Reading> readings;
    readings.reserve(2);
    readings.push_back(Reading("north", 1));
    readings.push_back(Reading("south", 99));

    Reading::reset_copies();
    first_above(readings, 50);
    RETRAINER_ASSERT_INT(Reading::copies(), 0);
}

RETRAINER_TEST(raising_by_nothing_changes_nothing, "cpp.values.auto") {
    std::vector<Reading> readings;
    readings.reserve(1);
    readings.push_back(Reading("north", 7));
    raise_all(readings, 0);
    RETRAINER_ASSERT_INT(readings[0].value, 7);
}

RETRAINER_TEST(raising_by_a_negative_amount_lowers, "cpp.values.auto") {
    std::vector<Reading> readings;
    readings.reserve(1);
    readings.push_back(Reading("north", 7));
    raise_all(readings, -10);
    RETRAINER_ASSERT_INT(readings[0].value, -3);
}

RETRAINER_TEST(an_empty_vector_totals_nothing_and_finds_nothing, "cpp.values.auto") {
    std::vector<Reading> none;
    RETRAINER_ASSERT_INT(total(none), 0);
    RETRAINER_ASSERT(first_above(none, 0) == nullptr, "nothing to find");
    raise_all(none, 5);
    RETRAINER_ASSERT_INT((int)none.size(), 0);
}

RETRAINER_TEST(an_empty_map_labels_nothing, "cpp.values.auto") {
    const std::map<std::string, int> none;
    RETRAINER_ASSERT_INT((int)label_all(none).size(), 0);
}

RETRAINER_TEST(the_threshold_is_above_not_at, "cpp.values.auto") {
    // A reading equal to the threshold is not above it. Off by one here means
    // an alarm that fires exactly at the limit it was told to allow.
    std::vector<Reading> readings;
    readings.reserve(2);
    readings.push_back(Reading("north", 50));
    readings.push_back(Reading("south", 51));

    const Reading *found = first_above(readings, 50);
    RETRAINER_ASSERT(found != nullptr, "fifty one is above fifty");
    if (found == nullptr) return;
    RETRAINER_ASSERT_STR(found->sensor, "south");
}

RETRAINER_TEST(labels_follow_the_maps_order_not_the_insertion_order, "cpp.values.auto") {
    std::map<std::string, int> values;
    values["zulu"] = 1;
    values["alpha"] = 2;
    values["mike"] = 3;

    const std::vector<std::string> labels = label_all(values);
    RETRAINER_ASSERT_INT((int)labels.size(), 3);
    if (labels.size() < 3) return;
    RETRAINER_ASSERT_STR(labels[0], "alpha=2");
    RETRAINER_ASSERT_STR(labels[1], "mike=3");
    RETRAINER_ASSERT_STR(labels[2], "zulu=1");
}

RETRAINER_TEST(a_negative_value_labels_with_its_sign, "cpp.values.auto") {
    const std::map<std::string, int> values{{"drift", -12}};
    const std::vector<std::string> labels = label_all(values);
    RETRAINER_ASSERT_INT((int)labels.size(), 1);
    if (labels.empty()) return;
    RETRAINER_ASSERT_STR(labels[0], "drift=-12");
}

RETRAINER_TEST(raising_twice_accumulates, "cpp.values.auto") {
    std::vector<Reading> readings;
    readings.reserve(1);
    readings.push_back(Reading("north", 1));
    raise_all(readings, 2);
    raise_all(readings, 3);
    RETRAINER_ASSERT_INT(readings[0].value, 6);
}

RETRAINER_TEST(the_copy_counter_counts_one_per_copy, "cpp.values.auto") {
    // Pinning the instrument before trusting what it says. A counter that
    // over-reports would make every "copies nothing" test above pass for the
    // wrong reason, and one that under-reports would hide a real copy.
    const Reading original("north", 1);
    Reading::reset_copies();

    Reading duplicate = original;
    RETRAINER_ASSERT_INT(Reading::copies(), 1);

    duplicate = original;
    RETRAINER_ASSERT_INT(Reading::copies(), 2);
    RETRAINER_ASSERT_INT(duplicate.value, 1);
    RETRAINER_ASSERT_STR(duplicate.sensor, "north");
}
