// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(parsing_is_exact_not_approximate, "cpp.types.enums") {
    // "warn" is not "warning" and "ERROR" is not "error". A parser that
    // accepts nearly-right names accepts typos as configuration.
    RETRAINER_ASSERT(!parse_level("warn").has_value(), "not a prefix");
    RETRAINER_ASSERT(!parse_level("warnings").has_value(), "not a superstring");
    RETRAINER_ASSERT(!parse_level("ERROR").has_value(), "and not a different case");
    RETRAINER_ASSERT(!parse_level(" info").has_value(), "spaces count");
}

RETRAINER_TEST(every_name_round_trips, "cpp.types.enums") {
    const Level all[] = {Level::debug, Level::info, Level::warning, Level::error,
                         Level::fatal};
    for (const Level level : all) {
        const std::optional<Level> parsed = parse_level(name(level));
        RETRAINER_ASSERT(parsed.has_value(), "a name it produced, it can read");
        if (!parsed.has_value()) continue;
        RETRAINER_ASSERT(parsed.value() == level, "and gets the same level back");
    }
}

RETRAINER_TEST(the_lowest_threshold_keeps_everything, "cpp.types.enums") {
    const std::vector<LogLine> lines{
        {Level::debug, "a"}, {Level::info, "b"}, {Level::fatal, "c"}};
    RETRAINER_ASSERT_INT((int)at_or_above(lines, Level::debug).size(), 3);
}

RETRAINER_TEST(the_highest_threshold_keeps_only_the_worst, "cpp.types.enums") {
    const std::vector<LogLine> lines{
        {Level::error, "a"}, {Level::fatal, "b"}, {Level::error, "c"}};
    const std::vector<std::string> kept = at_or_above(lines, Level::fatal);
    RETRAINER_ASSERT_INT((int)kept.size(), 1);
    if (kept.empty()) return;
    RETRAINER_ASSERT_STR(kept[0], "b");
}

RETRAINER_TEST(filtering_nothing_keeps_nothing, "cpp.types.enums") {
    RETRAINER_ASSERT_INT((int)at_or_above({}, Level::debug).size(), 0);
}

RETRAINER_TEST(the_threshold_is_at_or_above_not_above, "cpp.types.enums") {
    // Off by one here silently drops every line of exactly the level somebody
    // configured, which is the one level they were definitely interested in.
    const std::vector<LogLine> lines{{Level::warning, "exactly the threshold"}};
    RETRAINER_ASSERT_INT((int)at_or_above(lines, Level::warning).size(), 1);
}

RETRAINER_TEST(the_worst_of_nothing_is_debug, "cpp.types.enums") {
    RETRAINER_ASSERT(worst({}) == Level::debug, "nothing bad has happened");
}

RETRAINER_TEST(the_worst_of_one_is_that_one, "cpp.types.enums") {
    RETRAINER_ASSERT(worst({Level::warning}) == Level::warning, "the only one there is");
}

RETRAINER_TEST(the_worst_is_found_wherever_it_sits, "cpp.types.enums") {
    RETRAINER_ASSERT(worst({Level::fatal, Level::info}) == Level::fatal, "at the front");
    RETRAINER_ASSERT(worst({Level::info, Level::fatal}) == Level::fatal, "at the back");
    RETRAINER_ASSERT(worst({Level::info, Level::fatal, Level::debug}) == Level::fatal,
                     "in the middle");
}

RETRAINER_TEST(all_debug_stays_debug, "cpp.types.enums") {
    // A list of the lowest level must not creep upward. Starting the search
    // at something other than the lowest possible value would show up here.
    RETRAINER_ASSERT(worst({Level::debug, Level::debug}) == Level::debug, "still debug");
}

RETRAINER_TEST(severity_and_ordering_agree, "cpp.types.enums") {
    const Level all[] = {Level::debug, Level::info, Level::warning, Level::error,
                         Level::fatal};
    for (int index = 0; index + 1 < 5; index += 1) {
        RETRAINER_ASSERT(severity(all[index]) < severity(all[index + 1]),
                         "each level is more severe than the one before");
        RETRAINER_ASSERT(at_least(all[index + 1], all[index]),
                         "and comparing the levels says the same thing");
    }
}
