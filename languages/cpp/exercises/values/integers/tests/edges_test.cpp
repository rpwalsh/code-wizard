// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <limits>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_long_list_of_large_values_still_averages_correctly,
               "cpp.values.integers") {
    // Two billion times a thousand does not fit in an int. Summing into one
    // is undefined behavior, and the answer that comes back is whatever the
    // hardware happened to do.
    const int large = 2000000000;
    std::vector<int> values;
    for (int index = 0; index < 1000; index += 1) {
        values.push_back(large);
    }
    RETRAINER_ASSERT_INT(mean(values), large);
}

RETRAINER_TEST(the_mean_of_opposites_is_zero, "cpp.values.integers") {
    const int most = std::numeric_limits<int>::max();
    const int least = std::numeric_limits<int>::min();
    RETRAINER_ASSERT_INT(mean({most, least}), 0);
}

RETRAINER_TEST(overflow_is_spotted_at_the_bottom_too, "cpp.values.integers") {
    // The negative end is not symmetrical with the positive one: there is one
    // more negative value than positive, so a check written only for the top
    // misses the bottom by exactly one.
    const int least = std::numeric_limits<int>::min();
    RETRAINER_ASSERT(would_overflow(least, -1), "one below the bottom does not fit");
    RETRAINER_ASSERT(!would_overflow(least, 0), "the bottom itself is fine");
    RETRAINER_ASSERT(!would_overflow(least + 1, -1), "and this lands exactly on it");
}

RETRAINER_TEST(adding_a_negative_to_a_large_positive_always_fits,
               "cpp.values.integers") {
    const int most = std::numeric_limits<int>::max();
    RETRAINER_ASSERT(!would_overflow(most, -1), "coming down from the top is safe");
    RETRAINER_ASSERT(!would_overflow(std::numeric_limits<int>::min(), 1),
                     "and going up from the bottom is too");
}

RETRAINER_TEST(the_extremes_add_to_something_that_fits, "cpp.values.integers") {
    const int most = std::numeric_limits<int>::max();
    const int least = std::numeric_limits<int>::min();
    const std::optional<int> sum = checked_add(most, least);
    RETRAINER_ASSERT(sum.has_value(), "the extremes cancel to minus one");
    if (!sum.has_value()) return;
    RETRAINER_ASSERT_INT(sum.value(), -1);
}

RETRAINER_TEST(a_checked_addition_refuses_at_the_bottom, "cpp.values.integers") {
    RETRAINER_ASSERT(!checked_add(std::numeric_limits<int>::min(), -1).has_value(),
                     "there is nothing below the bottom");
}

RETRAINER_TEST(adding_zero_always_works, "cpp.values.integers") {
    const int most = std::numeric_limits<int>::max();
    const std::optional<int> sum = checked_add(most, 0);
    RETRAINER_ASSERT(sum.has_value(), "adding nothing changes nothing");
    if (!sum.has_value()) return;
    RETRAINER_ASSERT_INT(sum.value(), most);
}

RETRAINER_TEST(the_modulo_of_a_multiple_is_zero, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(modulo(9, 3), 0);
    RETRAINER_ASSERT_INT(modulo(-9, 3), 0);
    RETRAINER_ASSERT_INT(modulo(0, 3), 0);
}

RETRAINER_TEST(the_modulo_wraps_a_ring_in_both_directions, "cpp.values.integers") {
    // What this is actually for: stepping around a ring of four and landing
    // somewhere valid however far back you go.
    RETRAINER_ASSERT_INT(modulo(-1, 4), 3);
    RETRAINER_ASSERT_INT(modulo(-2, 4), 2);
    RETRAINER_ASSERT_INT(modulo(-5, 4), 3);
    RETRAINER_ASSERT_INT(modulo(5, 4), 1);
}

RETRAINER_TEST(a_divisor_of_one_leaves_nothing, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(modulo(7, 1), 0);
    RETRAINER_ASSERT_INT(modulo(-7, 1), 0);
}

RETRAINER_TEST(a_divisor_of_zero_or_below_is_refused, "cpp.values.integers") {
    const int bad[] = {0, -1, -5};
    for (const int divisor : bad) {
        bool caught = false;
        try {
            modulo(7, divisor);
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "the divisor has to be positive");
    }
}
