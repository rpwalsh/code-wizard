// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(the_range_is_the_two_ends, "cpp.std.tuple") {
    const auto [lowest, highest] = range_of({4, 1, 9, 3});
    RETRAINER_ASSERT_INT(lowest, 1);
    RETRAINER_ASSERT_INT(highest, 9);
}

RETRAINER_TEST(an_empty_list_has_no_range, "cpp.std.tuple") {
    bool caught = false;
    try {
        range_of({});
    } catch (const std::invalid_argument &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "there are no ends to find");
}

RETRAINER_TEST(an_entry_splits_into_three_parts, "cpp.std.tuple") {
    // A structured binding names the three parts where they arrive, which
    // beats get<0>, get<1> and get<2> at every later reading of this code.
    const auto [name, level, score] = parse_entry("ada/3/95");
    RETRAINER_ASSERT_STR(name, "ada");
    RETRAINER_ASSERT_INT(level, 3);
    RETRAINER_ASSERT_INT(score, 95);
}

RETRAINER_TEST(a_malformed_entry_is_refused, "cpp.std.tuple") {
    const std::string bad[] = {"ada/3", "ada/3/95/x", "ada/x/95", "/3/95", ""};
    for (const std::string &text : bad) {
        bool caught = false;
        try {
            parse_entry(text);
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "three parts, a name and two numbers");
    }
}

RETRAINER_TEST(a_summary_carries_three_answers_at_once, "cpp.std.tuple") {
    const auto [sum, count, average] = summarize({2, 4, 6});
    RETRAINER_ASSERT_INT(sum, 12);
    RETRAINER_ASSERT_INT(count, 3);
    RETRAINER_ASSERT_INT(average, 4);
}

RETRAINER_TEST(entries_sort_by_score_highest_first, "cpp.std.tuple") {
    const std::vector<std::pair<std::string, int>> entries{
        {"ada", 70}, {"bob", 95}, {"cyd", 80}};
    const std::vector<std::pair<std::string, int>> ordered = by_score(entries);

    RETRAINER_ASSERT_INT((int)ordered.size(), 3);
    if (ordered.size() < 3) return;
    RETRAINER_ASSERT_STR(ordered[0].first, "bob");
    RETRAINER_ASSERT_STR(ordered[1].first, "cyd");
    RETRAINER_ASSERT_STR(ordered[2].first, "ada");
}

RETRAINER_TEST(equal_scores_are_ordered_by_name, "cpp.std.tuple") {
    const std::vector<std::pair<std::string, int>> entries{
        {"zoe", 50}, {"ada", 50}, {"mia", 50}};
    const std::vector<std::pair<std::string, int>> ordered = by_score(entries);

    RETRAINER_ASSERT_INT((int)ordered.size(), 3);
    if (ordered.size() < 3) return;
    RETRAINER_ASSERT_STR(ordered[0].first, "ada");
    RETRAINER_ASSERT_STR(ordered[1].first, "mia");
    RETRAINER_ASSERT_STR(ordered[2].first, "zoe");
}
