// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(nothing_has_no_highest, "cpp.std.algorithms") {
    const std::vector<Reading> none;
    RETRAINER_ASSERT(!highest(none).has_value(), "an empty vector has no maximum");
}

RETRAINER_TEST(nothing_has_no_average, "cpp.std.algorithms") {
    const std::vector<Reading> none;
    // Not 0.0: zero is a plausible average and would be indistinguishable.
    RETRAINER_ASSERT(!average(none).has_value(), "an empty vector has no mean");
}

RETRAINER_TEST(nothing_has_no_sensors, "cpp.std.containers") {
    const std::vector<Reading> none;
    RETRAINER_ASSERT_INT(static_cast<int>(sensors(none).size()), 0);
}

RETRAINER_TEST(one_reading_is_its_own_highest_and_average, "cpp.std.algorithms") {
    const std::vector<Reading> one{{"only", 4.25}};

    const auto top = highest(one);
    RETRAINER_ASSERT(top.has_value(), "one reading is the highest");
    RETRAINER_ASSERT_NEAR(top->value, 4.25, 0.0001);
    RETRAINER_ASSERT_NEAR(*average(one), 4.25, 0.0001);
}

RETRAINER_TEST(duplicates_collapse_to_one_name, "cpp.std.containers") {
    const std::vector<Reading> repeated{
        {"a", 1.0}, {"a", 2.0}, {"a", 3.0},
    };

    const std::vector<std::string> names = sensors(repeated);
    RETRAINER_ASSERT_INT(static_cast<int>(names.size()), 1);
    RETRAINER_ASSERT_STR(names[0].c_str(), "a");
}

RETRAINER_TEST(negative_readings_are_still_readings, "cpp.std.algorithms") {
    const std::vector<Reading> cold{
        {"a", -5.0}, {"b", -1.0}, {"c", -9.0},
    };

    const auto top = highest(cold);
    RETRAINER_ASSERT(top.has_value(), "there is still a highest");
    RETRAINER_ASSERT_STR(top->sensor.c_str(), "b");
    RETRAINER_ASSERT_NEAR(*average(cold), -5.0, 0.0001);
}

RETRAINER_TEST(a_fallback_is_returned_for_an_empty_vector, "cpp.std.optional") {
    const std::vector<Reading> none;
    RETRAINER_ASSERT_NEAR(value_or(none, "a", 7.5), 7.5, 0.0001);
}
