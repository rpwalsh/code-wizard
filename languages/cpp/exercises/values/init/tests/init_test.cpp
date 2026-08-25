// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(repeating_makes_that_many_copies, "cpp.values.init") {
    const std::vector<int> zeros = repeated(3, 0);
    RETRAINER_ASSERT_INT((int)zeros.size(), 3);
    if (zeros.size() < 3) return;
    RETRAINER_ASSERT_INT(zeros[0], 0);
    RETRAINER_ASSERT_INT(zeros[2], 0);
}

RETRAINER_TEST(exactly_makes_a_vector_of_those_two_numbers, "cpp.values.init") {
    // Same two arguments as the test above, and a completely different
    // vector. Which of () and {} you wrote is the only difference.
    const std::vector<int> two = exactly(3, 0);
    RETRAINER_ASSERT_INT((int)two.size(), 2);
    if (two.size() < 2) return;
    RETRAINER_ASSERT_INT(two[0], 3);
    RETRAINER_ASSERT_INT(two[1], 0);
}

RETRAINER_TEST(the_defaults_are_the_declared_ones, "cpp.values.init") {
    const Settings settings = defaults();
    RETRAINER_ASSERT_INT(settings.retries, 3);
    RETRAINER_ASSERT_INT(settings.timeout_ms, 1000);
    RETRAINER_ASSERT(!settings.verbose, "quiet by default");
}

RETRAINER_TEST(setting_one_field_leaves_the_others_alone, "cpp.values.init") {
    const Settings settings = with_retries(7);
    RETRAINER_ASSERT_INT(settings.retries, 7);
    RETRAINER_ASSERT_INT(settings.timeout_ms, 1000);
    RETRAINER_ASSERT(!settings.verbose, "still quiet");
}

RETRAINER_TEST(turning_up_the_volume_changes_nothing_else, "cpp.values.init") {
    const Settings base = with_retries(5);
    const Settings loud = louder(base);

    RETRAINER_ASSERT(loud.verbose, "verbose now");
    RETRAINER_ASSERT_INT(loud.retries, 5);
    RETRAINER_ASSERT_INT(loud.timeout_ms, 1000);
}

RETRAINER_TEST(settings_describe_themselves, "cpp.values.init") {
    RETRAINER_ASSERT_STR(describe(defaults()), "retries=3 timeout=1000 verbose=no");
    RETRAINER_ASSERT_STR(describe(louder(defaults())), "retries=3 timeout=1000 verbose=yes");
}
