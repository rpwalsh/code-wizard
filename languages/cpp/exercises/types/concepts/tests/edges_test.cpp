// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_average_is_the_zero_value, "cpp.types.templates") {
    RETRAINER_ASSERT_INT(average(std::vector<int>{}), 0);
    RETRAINER_ASSERT_NEAR(average(std::vector<double>{}), 0.0, 1e-9);
}

RETRAINER_TEST(one_value_is_its_own_average, "cpp.types.templates") {
    RETRAINER_ASSERT_INT(average(std::vector<int>{7}), 7);
}

RETRAINER_TEST(keep_if_keeps_nothing_and_everything, "cpp.types.templates") {
    std::vector<int> values{1, 2, 3};
    RETRAINER_ASSERT_INT(
        static_cast<int>(keep_if(values, [](int) { return false; }).size()), 0);
    RETRAINER_ASSERT_INT(
        static_cast<int>(keep_if(values, [](int) { return true; }).size()), 3);
}

struct Item {
    std::string describe() const { return "item"; }
};

RETRAINER_TEST(joining_none_and_one_needs_no_separator, "cpp.types.concepts") {
    const std::string none = join_descriptions(std::vector<Item>{});
    const std::string one = join_descriptions(std::vector<Item>{{}});
    RETRAINER_ASSERT_STR(none.c_str(), "");
    RETRAINER_ASSERT_STR(one.c_str(), "item");
}

// The static proof: string fails Averageable (division stops it), and the
// concept reports it at the door rather than inside the body.
static_assert(!Averageable<std::string>);
static_assert(Averageable<int>);
static_assert(Averageable<double>);
static_assert(!Describable<int>);

RETRAINER_TEST(the_static_asserts_above_already_passed, "cpp.types.concepts") {
    RETRAINER_ASSERT(1, "concept membership is checked at compile time");
}
