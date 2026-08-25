// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(repeating_none_gives_an_empty_vector, "cpp.values.init") {
    RETRAINER_ASSERT_INT((int)repeated(0, 9).size(), 0);
}

RETRAINER_TEST(repeating_once_gives_one, "cpp.values.init") {
    // The size that hides the bug. repeated(1, 5) written with braces gives
    // a vector of one element too — and it holds 1, not 5.
    const std::vector<int> one = repeated(1, 5);
    RETRAINER_ASSERT_INT((int)one.size(), 1);
    if (one.empty()) return;
    RETRAINER_ASSERT_INT(one[0], 5);
}

RETRAINER_TEST(repeating_a_larger_count_keeps_the_value, "cpp.values.init") {
    const std::vector<int> many = repeated(5, -2);
    RETRAINER_ASSERT_INT((int)many.size(), 5);
    if (many.size() < 5) return;
    for (int index = 0; index < 5; index += 1) {
        RETRAINER_ASSERT_INT(many[index], -2);
    }
}

RETRAINER_TEST(exactly_keeps_the_order_it_was_given, "cpp.values.init") {
    const std::vector<int> two = exactly(1, 2);
    RETRAINER_ASSERT_INT((int)two.size(), 2);
    if (two.size() < 2) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT_INT(two[0], 1);
    RETRAINER_ASSERT_INT(two[1], 2);

    const std::vector<int> reversed = exactly(2, 1);
    RETRAINER_ASSERT_INT((int)reversed.size(), 2);
    if (reversed.size() < 2) return;
    RETRAINER_ASSERT_INT(reversed[0], 2);
    RETRAINER_ASSERT_INT(reversed[1], 1);
}

RETRAINER_TEST(exactly_two_zeros_is_still_two_elements, "cpp.values.init") {
    const std::vector<int> two = exactly(0, 0);
    RETRAINER_ASSERT_INT((int)two.size(), 2);
}

RETRAINER_TEST(setting_retries_to_zero_really_sets_it, "cpp.values.init") {
    // Zero is a value, not an absence. Code that treats a falsy setting as
    // "not provided" quietly restores the default somebody meant to remove.
    const Settings settings = with_retries(0);
    RETRAINER_ASSERT_INT(settings.retries, 0);
    RETRAINER_ASSERT_STR(describe(settings), "retries=0 timeout=1000 verbose=no");
}

RETRAINER_TEST(the_original_settings_are_not_changed, "cpp.values.init") {
    // louder takes a const reference and returns a new value. If it modified
    // a copy of the caller's object and the caller kept using the original,
    // this is where the difference shows.
    const Settings base = defaults();
    const Settings loud = louder(base);

    RETRAINER_ASSERT(loud.verbose, "the new one is loud");
    RETRAINER_ASSERT(!base.verbose, "the old one is untouched");
}

RETRAINER_TEST(making_it_louder_twice_is_still_loud, "cpp.values.init") {
    RETRAINER_ASSERT(louder(louder(defaults())).verbose, "not a toggle");
}

RETRAINER_TEST(describing_a_hand_built_settings_works_too, "cpp.values.init") {
    Settings settings;
    settings.retries = 9;
    settings.timeout_ms = 250;
    settings.verbose = true;
    RETRAINER_ASSERT_STR(describe(settings), "retries=9 timeout=250 verbose=yes");
}

RETRAINER_TEST(a_default_constructed_settings_matches_the_defaults, "cpp.values.init") {
    // Because every member has a default written beside it, this needs no
    // constructor at all and cannot disagree with defaults().
    const Settings declared;
    RETRAINER_ASSERT_STR(describe(declared), describe(defaults()));
}
