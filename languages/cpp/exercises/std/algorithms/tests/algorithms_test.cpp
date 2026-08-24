// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

static std::vector<Reading> sample() {
    return {{"a", 20}, {"b", 5}, {"c", 30}, {"d", 12}};
}

RETRAINER_TEST(dropping_below_removes_and_resizes, "cpp.std.algorithms") {
    auto kept = drop_below(sample(), 12);

    // Size, not just contents: remove_if alone leaves the vector its
    // original length with unspecified values at the end.
    RETRAINER_ASSERT_INT((int)kept.size(), 3);
    RETRAINER_ASSERT_STR(kept[0].sensor.c_str(), "a");
    RETRAINER_ASSERT_STR(kept[2].sensor.c_str(), "d");
}

RETRAINER_TEST(dropping_keeps_the_original_order, "cpp.std.algorithms") {
    auto kept = drop_below(sample(), 0);
    RETRAINER_ASSERT_INT((int)kept.size(), 4);
    RETRAINER_ASSERT_STR(kept[1].sensor.c_str(), "b");
}

RETRAINER_TEST(sensors_are_projected_in_order, "cpp.std.algorithms") {
    auto names = sensors_of(sample());
    RETRAINER_ASSERT_INT((int)names.size(), 4);
    RETRAINER_ASSERT_STR(names[0].c_str(), "a");
    RETRAINER_ASSERT_STR(names[3].c_str(), "d");
}

RETRAINER_TEST(any_above_finds_one, "cpp.std.algorithms") {
    RETRAINER_ASSERT(any_above(sample(), 25), "thirty is above twenty-five");
    RETRAINER_ASSERT(!any_above(sample(), 30), "nothing is above thirty");
}

RETRAINER_TEST(total_sums_the_temperatures, "cpp.std.algorithms") {
    RETRAINER_ASSERT_INT(total(sample()), 67);
}

RETRAINER_TEST(sorting_orders_by_temperature, "cpp.std.algorithms") {
    auto ordered = sorted_by_temperature(sample());
    RETRAINER_ASSERT_STR(ordered[0].sensor.c_str(), "b");
    RETRAINER_ASSERT_STR(ordered[3].sensor.c_str(), "c");
}
