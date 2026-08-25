// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <limits>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(the_mean_is_the_average, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(mean({2, 4, 6}), 4);
    RETRAINER_ASSERT_INT(mean({10}), 10);
}

RETRAINER_TEST(the_mean_rounds_toward_zero, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(mean({1, 2}), 1);
    RETRAINER_ASSERT_INT(mean({-1, -2}), -1);
}

RETRAINER_TEST(an_empty_list_averages_zero, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(mean({}), 0);
}

RETRAINER_TEST(overflow_is_spotted_before_it_happens, "cpp.values.integers") {
    const int most = std::numeric_limits<int>::max();
    RETRAINER_ASSERT(would_overflow(most, 1), "one past the top does not fit");
    RETRAINER_ASSERT(!would_overflow(most, 0), "adding nothing always fits");
    RETRAINER_ASSERT(!would_overflow(most - 1, 1), "and this lands exactly on it");
}

RETRAINER_TEST(a_checked_addition_returns_nothing_when_it_cannot_answer,
               "cpp.values.integers") {
    const int most = std::numeric_limits<int>::max();
    RETRAINER_ASSERT(!checked_add(most, 1).has_value(), "no answer fits");

    const std::optional<int> fine = checked_add(2, 3);
    RETRAINER_ASSERT(fine.has_value(), "five fits comfortably");
    if (!fine.has_value()) return;
    RETRAINER_ASSERT_INT(fine.value(), 5);
}

RETRAINER_TEST(the_last_index_is_one_before_the_size, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(last_index({1, 2, 3}), 2);
    RETRAINER_ASSERT_INT(last_index({7}), 0);
}

RETRAINER_TEST(an_empty_vector_has_no_last_index, "cpp.values.integers") {
    // Not a huge number. size() is unsigned, so size() - 1 on an empty
    // container is the largest size_t there is, and a loop trusting it runs
    // four billion times before anything looks wrong.
    RETRAINER_ASSERT_INT(last_index({}), -1);
}

RETRAINER_TEST(the_modulo_is_never_negative, "cpp.values.integers") {
    RETRAINER_ASSERT_INT(modulo(7, 3), 1);
    RETRAINER_ASSERT_INT(modulo(-1, 3), 2);
    RETRAINER_ASSERT_INT(modulo(-4, 3), 2);
}
