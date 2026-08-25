// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_large_sum_does_not_overflow, "cpp.std.numeric") {
    // The accumulator takes its type from the initial value, not from the
    // return type. Start at 0 rather than 0LL and this whole sum happens in
    // int, wraps, and the widening on the way out arrives far too late.
    std::vector<int> values;
    for (int index = 0; index < 100; index += 1) {
        values.push_back(100000000);
    }
    RETRAINER_ASSERT(total(values) == 10000000000LL, "ten billion, not a wrapped int");
}

RETRAINER_TEST(a_large_dot_product_does_not_overflow_either, "cpp.std.numeric") {
    std::vector<int> left;
    std::vector<int> right;
    for (int index = 0; index < 100; index += 1) {
        left.push_back(100000);
        right.push_back(100000);
    }
    RETRAINER_ASSERT(dot(left, right) == 1000000000000LL, "a trillion");
}

RETRAINER_TEST(nothing_totals_zero, "cpp.std.numeric") {
    RETRAINER_ASSERT_INT((int)total({}), 0);
    RETRAINER_ASSERT_INT((int)running_totals({}).size(), 0);
    RETRAINER_ASSERT_INT((int)differences({}).size(), 0);
    RETRAINER_ASSERT_INT((int)dot({}, {}), 0);
}

RETRAINER_TEST(one_value_is_its_own_running_total_and_difference,
               "cpp.std.numeric") {
    // adjacent_difference copies the first element through rather than
    // differencing it, which is what makes the two functions inverses.
    const std::vector<int> totals = running_totals({7});
    const std::vector<int> steps = differences({7});
    RETRAINER_ASSERT_INT((int)totals.size(), 1);
    RETRAINER_ASSERT_INT((int)steps.size(), 1);
    if (totals.empty() || steps.empty()) return;
    RETRAINER_ASSERT_INT(totals[0], 7);
    RETRAINER_ASSERT_INT(steps[0], 7);
}

RETRAINER_TEST(differences_undo_running_totals, "cpp.std.numeric") {
    const std::vector<int> original{4, -2, 9, 0, 3};
    const std::vector<int> back = differences(running_totals(original));

    RETRAINER_ASSERT_INT((int)back.size(), (int)original.size());
    if (back.size() != original.size()) return;
    for (std::size_t index = 0; index < back.size(); index += 1) {
        RETRAINER_ASSERT_INT(back[index], original[index]);
    }
}

RETRAINER_TEST(negative_values_run_downhill, "cpp.std.numeric") {
    const std::vector<int> totals = running_totals({5, -3, -4});
    RETRAINER_ASSERT_INT((int)totals.size(), 3);
    if (totals.size() < 3) return;
    RETRAINER_ASSERT_INT(totals[0], 5);
    RETRAINER_ASSERT_INT(totals[1], 2);
    RETRAINER_ASSERT_INT(totals[2], -2);
}

RETRAINER_TEST(a_sequence_of_zero_or_below_is_empty, "cpp.std.numeric") {
    RETRAINER_ASSERT_INT((int)sequence(0).size(), 0);
    RETRAINER_ASSERT_INT((int)sequence(-5).size(), 0);
}

RETRAINER_TEST(a_sequence_of_one_is_just_zero, "cpp.std.numeric") {
    const std::vector<int> values = sequence(1);
    RETRAINER_ASSERT_INT((int)values.size(), 1);
    if (values.empty()) return;
    RETRAINER_ASSERT_INT(values[0], 0);
}

RETRAINER_TEST(a_sequence_totals_the_triangular_number, "cpp.std.numeric") {
    // 0 through 9 add to 45. A sequence starting at one instead would give
    // 55, and off-by-one at the start is the usual way iota is misused.
    RETRAINER_ASSERT_INT((int)total(sequence(10)), 45);
}

RETRAINER_TEST(a_dot_product_with_zeros_is_zero, "cpp.std.numeric") {
    RETRAINER_ASSERT_INT((int)dot({0, 0, 0}, {1, 2, 3}), 0);
}

RETRAINER_TEST(a_dot_product_handles_negatives, "cpp.std.numeric") {
    RETRAINER_ASSERT_INT((int)dot({1, -2}, {3, 4}), -5);
}

RETRAINER_TEST(the_longer_side_is_refused_from_either_direction,
               "cpp.std.numeric") {
    const std::vector<int> shorter{1, 2};
    const std::vector<int> longer{1, 2, 3};
    for (int direction = 0; direction < 2; direction += 1) {
        bool caught = false;
        try {
            if (direction == 0) {
                dot(shorter, longer);
            } else {
                dot(longer, shorter);
            }
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "mismatched lengths, whichever is longer");
    }
}
