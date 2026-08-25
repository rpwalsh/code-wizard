// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(the_total_adds_everything, "cpp.std.numeric") {
    RETRAINER_ASSERT_INT((int)total({1, 2, 3, 4}), 10);
    RETRAINER_ASSERT_INT((int)total({5}), 5);
}

RETRAINER_TEST(running_totals_grow_along_the_way, "cpp.std.numeric") {
    const std::vector<int> totals = running_totals({1, 2, 3});
    RETRAINER_ASSERT_INT((int)totals.size(), 3);
    if (totals.size() < 3) return;
    RETRAINER_ASSERT_INT(totals[0], 1);
    RETRAINER_ASSERT_INT(totals[1], 3);
    RETRAINER_ASSERT_INT(totals[2], 6);
}

RETRAINER_TEST(differences_are_the_steps_between, "cpp.std.numeric") {
    const std::vector<int> steps = differences({1, 3, 6});
    RETRAINER_ASSERT_INT((int)steps.size(), 3);
    if (steps.size() < 3) return;
    RETRAINER_ASSERT_INT(steps[0], 1);
    RETRAINER_ASSERT_INT(steps[1], 2);
    RETRAINER_ASSERT_INT(steps[2], 3);
}

RETRAINER_TEST(a_sequence_counts_up_from_zero, "cpp.std.numeric") {
    const std::vector<int> values = sequence(4);
    RETRAINER_ASSERT_INT((int)values.size(), 4);
    if (values.size() < 4) return;
    RETRAINER_ASSERT_INT(values[0], 0);
    RETRAINER_ASSERT_INT(values[3], 3);
}

RETRAINER_TEST(the_dot_product_pairs_them_up, "cpp.std.numeric") {
    RETRAINER_ASSERT_INT((int)dot({1, 2, 3}, {4, 5, 6}), 32);
}

RETRAINER_TEST(different_lengths_are_refused, "cpp.std.numeric") {
    // Reading past the end of the shorter one is the alternative, and it does
    // not announce itself.
    bool caught = false;
    try {
        dot({1, 2}, {1, 2, 3});
    } catch (const std::invalid_argument &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "there is no pairing for the extra one");
}
