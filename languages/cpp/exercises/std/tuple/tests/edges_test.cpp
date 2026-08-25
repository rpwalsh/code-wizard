// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_single_value_is_both_ends, "cpp.std.tuple") {
    const auto [lowest, highest] = range_of({7});
    RETRAINER_ASSERT_INT(lowest, 7);
    RETRAINER_ASSERT_INT(highest, 7);
}

RETRAINER_TEST(all_equal_values_are_both_ends, "cpp.std.tuple") {
    const auto [lowest, highest] = range_of({3, 3, 3});
    RETRAINER_ASSERT_INT(lowest, 3);
    RETRAINER_ASSERT_INT(highest, 3);
}

RETRAINER_TEST(negatives_do_not_confuse_the_ends, "cpp.std.tuple") {
    const auto [lowest, highest] = range_of({-5, -1, -9});
    RETRAINER_ASSERT_INT(lowest, -9);
    RETRAINER_ASSERT_INT(highest, -1);
}

RETRAINER_TEST(the_ends_come_back_the_right_way_round, "cpp.std.tuple") {
    // Ascending and descending input, same answer. Returning them swapped is
    // the sort of thing that passes on symmetric test data.
    const auto [low_a, high_a] = range_of({1, 2, 3});
    const auto [low_b, high_b] = range_of({3, 2, 1});
    RETRAINER_ASSERT_INT(low_a, 1);
    RETRAINER_ASSERT_INT(high_a, 3);
    RETRAINER_ASSERT_INT(low_b, 1);
    RETRAINER_ASSERT_INT(high_b, 3);
}

RETRAINER_TEST(a_summary_of_nothing_is_all_zeros, "cpp.std.tuple") {
    const auto [sum, count, average] = summarize({});
    RETRAINER_ASSERT_INT(sum, 0);
    RETRAINER_ASSERT_INT(count, 0);
    RETRAINER_ASSERT_INT(average, 0);
}

RETRAINER_TEST(the_average_rounds_toward_zero, "cpp.std.tuple") {
    const auto [sum_up, count_up, average_up] = summarize({1, 2});
    RETRAINER_ASSERT_INT(sum_up, 3);
    RETRAINER_ASSERT_INT(count_up, 2);
    RETRAINER_ASSERT_INT(average_up, 1);

    const auto [sum_down, count_down, average_down] = summarize({-1, -2});
    RETRAINER_ASSERT_INT(sum_down, -3);
    RETRAINER_ASSERT_INT(count_down, 2);
    RETRAINER_ASSERT_INT(average_down, -1);
}

RETRAINER_TEST(a_score_of_zero_is_a_score, "cpp.std.tuple") {
    const auto [name, level, score] = parse_entry("ada/0/0");
    RETRAINER_ASSERT_STR(name, "ada");
    RETRAINER_ASSERT_INT(level, 0);
    RETRAINER_ASSERT_INT(score, 0);
}

RETRAINER_TEST(a_name_may_contain_anything_but_a_slash, "cpp.std.tuple") {
    const auto [name, level, score] = parse_entry("ada lovelace/1/2");
    RETRAINER_ASSERT_STR(name, "ada lovelace");
    RETRAINER_ASSERT_INT(level, 1);
    RETRAINER_ASSERT_INT(score, 2);
}

RETRAINER_TEST(negative_numbers_are_not_valid_here, "cpp.std.tuple") {
    // A minus sign is not a digit, and a level below zero is not a thing.
    bool caught = false;
    try {
        parse_entry("ada/-1/95");
    } catch (const std::invalid_argument &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "levels do not go below zero");
}

RETRAINER_TEST(sorting_nothing_gives_nothing, "cpp.std.tuple") {
    RETRAINER_ASSERT_INT((int)by_score({}).size(), 0);
}

RETRAINER_TEST(sorting_one_gives_that_one, "cpp.std.tuple") {
    const std::vector<std::pair<std::string, int>> ordered = by_score({{"solo", 1}});
    RETRAINER_ASSERT_INT((int)ordered.size(), 1);
    if (ordered.empty()) return;
    RETRAINER_ASSERT_STR(ordered[0].first, "solo");
}

RETRAINER_TEST(the_two_keys_run_in_opposite_directions, "cpp.std.tuple") {
    // Score descending, name ascending. Sorting by the pair as a whole gets
    // both keys the same way round, which is wrong for one of them.
    const std::vector<std::pair<std::string, int>> entries{
        {"ada", 90}, {"zoe", 90}, {"bob", 95}};
    const std::vector<std::pair<std::string, int>> ordered = by_score(entries);

    RETRAINER_ASSERT_INT((int)ordered.size(), 3);
    if (ordered.size() < 3) return;
    RETRAINER_ASSERT_STR(ordered[0].first, "bob");
    RETRAINER_ASSERT_STR(ordered[1].first, "ada");
    RETRAINER_ASSERT_STR(ordered[2].first, "zoe");
}

RETRAINER_TEST(the_caller_vector_is_not_disturbed, "cpp.std.tuple") {
    std::vector<std::pair<std::string, int>> entries{{"ada", 1}, {"bob", 9}};
    by_score(entries);
    RETRAINER_ASSERT_INT((int)entries.size(), 2);
    if (entries.size() < 2) return;
    RETRAINER_ASSERT_STR(entries[0].first, "ada");
}

RETRAINER_TEST(an_empty_number_field_is_refused, "cpp.std.tuple") {
    // "ada//95" has three parts and one of them is nothing. Treating an
    // empty field as a valid number reads it as zero, which is a level
    // somebody never typed.
    const std::string bad[] = {"ada//95", "ada/3/", "ada//"};
    for (const std::string &text : bad) {
        bool caught = false;
        try {
            parse_entry(text);
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "an empty field is not a number");
    }
}

RETRAINER_TEST(a_bad_character_at_the_front_is_still_bad, "cpp.std.tuple") {
    // Checking from the second character onward accepts "x9" as ninety-nine
    // or whatever the arithmetic makes of it. Every character counts.
    const std::string bad[] = {"ada/x9/95", "ada/3/x5", "ada/9x/95"};
    for (const std::string &text : bad) {
        bool caught = false;
        try {
            parse_entry(text);
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "every character has to be a digit");
    }
}
