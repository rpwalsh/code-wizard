// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

static std::vector<Reading> sample() {
    return {
        {"north", 12.5},
        {"south", 18.0},
        {"north", 9.5},
        {"east", 18.0},
    };
}

RETRAINER_TEST(finds_the_first_reading_from_a_sensor, "cpp.std.optional") {
    const auto found = find_reading(sample(), "north");
    RETRAINER_ASSERT(found.has_value(), "north should be present");
    RETRAINER_ASSERT_NEAR(found->value, 12.5, 0.0001);
}

RETRAINER_TEST(a_missing_sensor_yields_nothing, "cpp.std.optional") {
    RETRAINER_ASSERT(!find_reading(sample(), "west").has_value(),
                     "west was never recorded");
}

RETRAINER_TEST(highest_takes_the_earlier_of_a_tie, "cpp.std.algorithms") {
    const auto found = highest(sample());
    RETRAINER_ASSERT(found.has_value(), "there is a highest reading");
    RETRAINER_ASSERT_STR(found->sensor.c_str(), "south");
    RETRAINER_ASSERT_NEAR(found->value, 18.0, 0.0001);
}

RETRAINER_TEST(averages_the_values, "cpp.std.algorithms") {
    const auto mean = average(sample());
    RETRAINER_ASSERT(mean.has_value(), "four readings have a mean");
    RETRAINER_ASSERT_NEAR(*mean, 14.5, 0.0001);
}

RETRAINER_TEST(lists_each_sensor_once_in_order, "cpp.std.containers") {
    const std::vector<std::string> names = sensors(sample());
    RETRAINER_ASSERT_INT(static_cast<int>(names.size()), 3);
    RETRAINER_ASSERT_STR(names[0].c_str(), "east");
    RETRAINER_ASSERT_STR(names[1].c_str(), "north");
    RETRAINER_ASSERT_STR(names[2].c_str(), "south");
}

RETRAINER_TEST(value_or_falls_back, "cpp.std.optional") {
    RETRAINER_ASSERT_NEAR(value_or(sample(), "north", -1.0), 12.5, 0.0001);
    RETRAINER_ASSERT_NEAR(value_or(sample(), "west", -1.0), -1.0, 0.0001);
}
