// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <map>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
std::vector<Reading> sample() {
    std::vector<Reading> readings;
    readings.reserve(3);
    readings.push_back(Reading("north", 10));
    readings.push_back(Reading("south", 20));
    readings.push_back(Reading("east", 30));
    return readings;
}
}  // namespace

RETRAINER_TEST(raising_changes_the_readings_themselves, "cpp.values.auto") {
    std::vector<Reading> readings = sample();
    raise_all(readings, 5);

    RETRAINER_ASSERT_INT(readings[0].value, 15);
    RETRAINER_ASSERT_INT(readings[1].value, 25);
    RETRAINER_ASSERT_INT(readings[2].value, 35);
}

RETRAINER_TEST(the_total_adds_every_value, "cpp.values.auto") {
    const std::vector<Reading> readings = sample();
    RETRAINER_ASSERT_INT(total(readings), 60);
}

RETRAINER_TEST(reading_the_total_copies_nothing, "cpp.values.auto") {
    // A loop over `auto` instead of `const auto &` copies every element,
    // which for a string member is an allocation each time round. The answer
    // is identical and the cost is not.
    const std::vector<Reading> readings = sample();
    Reading::reset_copies();
    total(readings);
    RETRAINER_ASSERT_INT(Reading::copies(), 0);
}

RETRAINER_TEST(labels_pair_each_name_with_its_value, "cpp.values.auto") {
    const std::map<std::string, int> values{{"alpha", 1}, {"beta", 2}};
    const std::vector<std::string> labels = label_all(values);

    RETRAINER_ASSERT_INT((int)labels.size(), 2);
    if (labels.size() < 2) return;
    RETRAINER_ASSERT_STR(labels[0], "alpha=1");
    RETRAINER_ASSERT_STR(labels[1], "beta=2");
}

RETRAINER_TEST(the_first_reading_above_a_threshold_is_found, "cpp.values.auto") {
    const std::vector<Reading> readings = sample();
    const Reading *found = first_above(readings, 15);

    RETRAINER_ASSERT(found != nullptr, "twenty is above fifteen");
    if (found == nullptr) return;
    RETRAINER_ASSERT_STR(found->sensor, "south");
}

RETRAINER_TEST(nothing_above_the_threshold_is_a_null_pointer, "cpp.values.auto") {
    const std::vector<Reading> readings = sample();
    RETRAINER_ASSERT(first_above(readings, 100) == nullptr, "nothing is that high");
}
