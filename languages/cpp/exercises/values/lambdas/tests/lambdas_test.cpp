// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <functional>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_counter_hands_out_increasing_numbers, "cpp.values.lambdas") {
    std::function<int()> next = make_counter(10);
    RETRAINER_ASSERT_INT(next(), 10);
    RETRAINER_ASSERT_INT(next(), 11);
    RETRAINER_ASSERT_INT(next(), 12);
}

RETRAINER_TEST(two_counters_do_not_share_a_count, "cpp.values.lambdas") {
    std::function<int()> left = make_counter(0);
    std::function<int()> right = make_counter(100);

    RETRAINER_ASSERT_INT(left(), 0);
    RETRAINER_ASSERT_INT(right(), 100);
    RETRAINER_ASSERT_INT(left(), 1);
    RETRAINER_ASSERT_INT(right(), 101);
}

RETRAINER_TEST(a_snapshot_predicate_keeps_the_number_it_was_given, "cpp.values.lambdas") {
    const std::function<bool(int)> above_five = above_snapshot(5);
    RETRAINER_ASSERT(above_five(6), "six is above five");
    RETRAINER_ASSERT(!above_five(5), "five is not above five");
    RETRAINER_ASSERT(!above_five(4), "and four certainly is not");
}

RETRAINER_TEST(a_live_predicate_reads_the_number_each_time, "cpp.values.lambdas") {
    int limit = 5;
    const std::function<bool(int)> above = above_live(limit);
    RETRAINER_ASSERT(above(6), "six is above five");

    limit = 100;
    RETRAINER_ASSERT(!above(6), "six is not above a hundred");
}

RETRAINER_TEST(the_two_predicates_disagree_after_the_number_changes, "cpp.values.lambdas") {
    // Same starting number, two capture modes, two different answers. This
    // is the whole distinction in one assertion.
    int limit = 5;
    const std::function<bool(int)> snapshot = above_snapshot(limit);
    const std::function<bool(int)> live = above_live(limit);

    limit = 100;
    RETRAINER_ASSERT(snapshot(10), "the snapshot still compares against five");
    RETRAINER_ASSERT(!live(10), "the live one compares against a hundred");
}

RETRAINER_TEST(filtering_keeps_what_the_predicate_says, "cpp.values.lambdas") {
    const std::vector<int> values{1, 2, 3, 4, 5, 6};
    const std::vector<int> kept = filter(values, [](int value) { return value % 2 == 0; });

    RETRAINER_ASSERT_INT((int)kept.size(), 3);
    if (kept.size() < 3) return;
    RETRAINER_ASSERT_INT(kept[0], 2);
    RETRAINER_ASSERT_INT(kept[2], 6);
}

RETRAINER_TEST(actions_are_applied_in_order, "cpp.values.lambdas") {
    // Order matters: doubling then adding one is not adding one then
    // doubling, and the test would pass for either if they commuted.
    const std::vector<std::function<int(int)>> actions{
        [](int value) { return value * 2; },
        [](int value) { return value + 1; },
    };
    RETRAINER_ASSERT_INT(apply_all(5, actions), 11);
}
