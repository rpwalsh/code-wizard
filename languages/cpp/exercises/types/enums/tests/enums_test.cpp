// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(every_level_has_a_name, "cpp.types.enums") {
    RETRAINER_ASSERT_STR(name(Level::debug), "debug");
    RETRAINER_ASSERT_STR(name(Level::info), "info");
    RETRAINER_ASSERT_STR(name(Level::warning), "warning");
    RETRAINER_ASSERT_STR(name(Level::error), "error");
    RETRAINER_ASSERT_STR(name(Level::fatal), "fatal");
}

RETRAINER_TEST(a_name_reads_back_as_a_level, "cpp.types.enums") {
    const std::optional<Level> parsed = parse_level("warning");
    RETRAINER_ASSERT(parsed.has_value(), "warning is a level");
    if (!parsed.has_value()) return;
    RETRAINER_ASSERT(parsed.value() == Level::warning, "and it is that one");
}

RETRAINER_TEST(nonsense_is_not_a_level, "cpp.types.enums") {
    RETRAINER_ASSERT(!parse_level("banana").has_value(), "no such level");
    RETRAINER_ASSERT(!parse_level("").has_value(), "and nothing is not one either");
}

RETRAINER_TEST(severity_counts_up_from_debug, "cpp.types.enums") {
    RETRAINER_ASSERT_INT(severity(Level::debug), 0);
    RETRAINER_ASSERT_INT(severity(Level::info), 1);
    RETRAINER_ASSERT_INT(severity(Level::fatal), 4);
}

RETRAINER_TEST(a_level_is_at_least_itself, "cpp.types.enums") {
    RETRAINER_ASSERT(at_least(Level::warning, Level::warning), "at least means at or above");
    RETRAINER_ASSERT(at_least(Level::error, Level::warning), "error is worse than warning");
    RETRAINER_ASSERT(!at_least(Level::info, Level::warning), "info is not");
}

RETRAINER_TEST(lines_below_the_threshold_are_left_out, "cpp.types.enums") {
    const std::vector<LogLine> lines{
        {Level::debug, "starting"},
        {Level::error, "disk full"},
        {Level::info, "listening"},
        {Level::fatal, "giving up"},
    };
    const std::vector<std::string> kept = at_or_above(lines, Level::error);

    RETRAINER_ASSERT_INT((int)kept.size(), 2);
    if (kept.size() < 2) return;
    RETRAINER_ASSERT_STR(kept[0], "disk full");
    RETRAINER_ASSERT_STR(kept[1], "giving up");
}

RETRAINER_TEST(the_worst_level_present_is_found, "cpp.types.enums") {
    const std::vector<Level> levels{Level::info, Level::error, Level::debug};
    RETRAINER_ASSERT(worst(levels) == Level::error, "error is the worst of those");
}
