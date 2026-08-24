// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(trimming_removes_both_ends, "cpp.std.strings") {
    RETRAINER_ASSERT(trimmed("  hello  ") == "hello", "spaces removed from both ends");
    RETRAINER_ASSERT(trimmed("hello") == "hello", "nothing to remove");
}

RETRAINER_TEST(trimming_handles_tabs_and_newlines, "cpp.std.strings") {
    RETRAINER_ASSERT(trimmed("\t hello \n") == "hello", "whitespace is more than a space");
}

RETRAINER_TEST(splitting_finds_every_field, "cpp.std.strings") {
    const std::vector<std::string_view> parts = split("a,b,c", ',');
    RETRAINER_ASSERT_INT((int)parts.size(), 3);
    if (parts.size() < 3) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT(parts[0] == "a", "first field");
    RETRAINER_ASSERT(parts[2] == "c", "last field");
}

RETRAINER_TEST(splitting_text_with_no_separator_gives_one_field, "cpp.std.strings") {
    const std::vector<std::string_view> parts = split("alone", ',');
    RETRAINER_ASSERT_INT((int)parts.size(), 1);
    if (parts.size() < 1) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT(parts[0] == "alone", "the whole text");
}

RETRAINER_TEST(joining_puts_the_separator_between, "cpp.std.strings") {
    const std::vector<std::string_view> parts{"a", "b", "c"};
    // Named, not inline: c_str() on a temporary dangles the moment the
    // full expression ends, which is the same lesson from the other side.
    const std::string joined = join(parts, '-');
    RETRAINER_ASSERT_STR(joined.c_str(), "a-b-c");
}

RETRAINER_TEST(splitting_and_joining_round_trip, "cpp.std.strings") {
    const std::string original = "one,two,three";
    const std::string rebuilt = join(split(original, ','), ',');
    RETRAINER_ASSERT_STR(rebuilt.c_str(), original.c_str());
}

RETRAINER_TEST(a_prefix_is_recognized, "cpp.std.strings") {
    const std::vector<std::string_view> prefixes{"http://", "https://"};
    RETRAINER_ASSERT(starts_with_any("https://example.test", prefixes), "matches the second");
    RETRAINER_ASSERT(!starts_with_any("ftp://example.test", prefixes), "matches neither");
}
