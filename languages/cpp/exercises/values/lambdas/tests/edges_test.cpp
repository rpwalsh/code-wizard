// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <functional>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_counter_can_start_anywhere, "cpp.values.lambdas") {
    std::function<int()> negative = make_counter(-2);
    RETRAINER_ASSERT_INT(negative(), -2);
    RETRAINER_ASSERT_INT(negative(), -1);
    RETRAINER_ASSERT_INT(negative(), 0);
    RETRAINER_ASSERT_INT(negative(), 1);
}

RETRAINER_TEST(a_copied_counter_carries_its_own_position, "cpp.values.lambdas") {
    // std::function holds the lambda by value, so copying one copies the
    // captured state with it. The copy continues from where the original was,
    // and the two then move apart.
    std::function<int()> original = make_counter(0);
    RETRAINER_ASSERT_INT(original(), 0);
    RETRAINER_ASSERT_INT(original(), 1);

    std::function<int()> copy = original;
    RETRAINER_ASSERT_INT(copy(), 2);
    RETRAINER_ASSERT_INT(original(), 2);
    RETRAINER_ASSERT_INT(copy(), 3);
}

RETRAINER_TEST(a_snapshot_survives_the_variable_it_was_made_from, "cpp.values.lambdas") {
    std::function<bool(int)> above;
    {
        const int limit = 7;
        above = above_snapshot(limit);
    }
    // limit is gone. The snapshot copied the number and is unbothered.
    RETRAINER_ASSERT(above(8), "eight is above seven");
    RETRAINER_ASSERT(!above(7), "seven is not");
}

RETRAINER_TEST(a_live_predicate_follows_the_number_downward_too, "cpp.values.lambdas") {
    int limit = 100;
    const std::function<bool(int)> above = above_live(limit);
    RETRAINER_ASSERT(!above(50), "fifty is below a hundred");

    limit = 10;
    RETRAINER_ASSERT(above(50), "and above ten");
}

RETRAINER_TEST(the_threshold_is_above_not_at, "cpp.values.lambdas") {
    const std::function<bool(int)> above = above_snapshot(0);
    RETRAINER_ASSERT(!above(0), "zero is not above zero");
    RETRAINER_ASSERT(above(1), "one is");
    RETRAINER_ASSERT(!above(-1), "minus one is not");
}

RETRAINER_TEST(filtering_nothing_keeps_nothing, "cpp.values.lambdas") {
    RETRAINER_ASSERT_INT((int)filter({}, [](int) { return true; }).size(), 0);
}

RETRAINER_TEST(a_predicate_that_never_agrees_keeps_nothing, "cpp.values.lambdas") {
    const std::vector<int> values{1, 2, 3};
    RETRAINER_ASSERT_INT((int)filter(values, [](int) { return false; }).size(), 0);
    RETRAINER_ASSERT_INT((int)filter(values, [](int) { return true; }).size(), 3);
}

RETRAINER_TEST(filtering_keeps_the_original_order, "cpp.values.lambdas") {
    const std::vector<int> values{9, 1, 8, 2, 7};
    const std::vector<int> kept = filter(values, [](int value) { return value > 5; });
    RETRAINER_ASSERT_INT((int)kept.size(), 3);
    if (kept.size() < 3) return;
    RETRAINER_ASSERT_INT(kept[0], 9);
    RETRAINER_ASSERT_INT(kept[1], 8);
    RETRAINER_ASSERT_INT(kept[2], 7);
}

RETRAINER_TEST(a_filter_can_close_over_something_of_its_own, "cpp.values.lambdas") {
    // The lambda passed in counts how often it was asked, which proves the
    // predicate is called once per value and not once per kept value.
    int asked = 0;
    const std::vector<int> values{1, 2, 3, 4};
    const std::vector<int> kept =
        filter(values, [&asked](int value) {
            asked += 1;
            return value > 2;
        });

    RETRAINER_ASSERT_INT(asked, 4);
    RETRAINER_ASSERT_INT((int)kept.size(), 2);
}

RETRAINER_TEST(applying_no_actions_returns_the_starting_value, "cpp.values.lambdas") {
    RETRAINER_ASSERT_INT(apply_all(42, {}), 42);
}

RETRAINER_TEST(applying_one_action_applies_it_once, "cpp.values.lambdas") {
    const std::vector<std::function<int(int)>> actions{
        [](int value) { return value * 3; },
    };
    RETRAINER_ASSERT_INT(apply_all(4, actions), 12);
}

RETRAINER_TEST(the_order_of_actions_is_the_order_given, "cpp.values.lambdas") {
    const std::vector<std::function<int(int)>> forwards{
        [](int value) { return value + 1; },
        [](int value) { return value * 10; },
    };
    const std::vector<std::function<int(int)>> backwards{
        [](int value) { return value * 10; },
        [](int value) { return value + 1; },
    };
    RETRAINER_ASSERT_INT(apply_all(1, forwards), 20);
    RETRAINER_ASSERT_INT(apply_all(1, backwards), 11);
}

RETRAINER_TEST(the_live_threshold_is_above_not_at_either, "cpp.values.lambdas") {
    // The snapshot version is tested for this above. The live one is a
    // separate function and gets its boundary wrong just as easily.
    int limit = 5;
    const std::function<bool(int)> above = above_live(limit);
    RETRAINER_ASSERT(!above(5), "five is not above five");
    RETRAINER_ASSERT(above(6), "six is");

    limit = 0;
    RETRAINER_ASSERT(!above(0), "zero is not above zero");
    RETRAINER_ASSERT(above(1), "one is");
}
