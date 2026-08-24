// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_view_points_into_the_text_it_came_from, "cpp.lifetime.references") {
    // The whole reason to use a view: no allocation, no copy. If trimming
    // returned a new string the pointer would land somewhere else, and the
    // cheapness the type exists for would be gone.
    const std::string source = "   payload   ";
    const std::string_view view = trimmed(source);

    RETRAINER_ASSERT(view.data() >= source.data(), "the view starts inside the source");
    RETRAINER_ASSERT(view.data() + view.size() <= source.data() + source.size(),
                     "and ends inside it too");
    RETRAINER_ASSERT(view == "payload", "with the right contents");
}

RETRAINER_TEST(split_views_point_into_the_original_too, "cpp.lifetime.references") {
    const std::string source = "alpha,beta";
    const std::vector<std::string_view> parts = split(source, ',');

    RETRAINER_ASSERT_INT((int)parts.size(), 2);
    if (parts.size() < 2) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT(parts[1].data() > source.data(), "the second field is further along");
    RETRAINER_ASSERT(parts[1] == "beta", "and reads correctly");
}

RETRAINER_TEST(trimming_nothing_but_space_leaves_nothing, "cpp.std.strings") {
    // The loop has to stop when the view empties, or it walks off the end.
    RETRAINER_ASSERT(trimmed("     ").empty(), "all space trims to empty");
    RETRAINER_ASSERT(trimmed("").empty(), "empty stays empty");
}

RETRAINER_TEST(empty_fields_are_still_fields, "cpp.std.strings") {
    const std::vector<std::string_view> parts = split("a,,b", ',');
    RETRAINER_ASSERT_INT((int)parts.size(), 3);
    if (parts.size() < 3) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT(parts[1].empty(), "the middle field is empty and present");
}

RETRAINER_TEST(a_trailing_separator_makes_a_trailing_field, "cpp.std.strings") {
    // "a," is two fields. Stopping at the last separator loses the empty
    // one, and a row silently gains a column somewhere else.
    const std::vector<std::string_view> parts = split("a,", ',');
    RETRAINER_ASSERT_INT((int)parts.size(), 2);
    if (parts.size() < 2) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT(parts[1].empty(), "the tail is an empty field");
}

RETRAINER_TEST(a_leading_separator_makes_a_leading_field, "cpp.std.strings") {
    const std::vector<std::string_view> parts = split(",a", ',');
    RETRAINER_ASSERT_INT((int)parts.size(), 2);
    if (parts.size() < 2) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT(parts[0].empty(), "the head is an empty field");
}

RETRAINER_TEST(splitting_nothing_gives_no_fields, "cpp.std.strings") {
    RETRAINER_ASSERT_INT((int)split("", ',').size(), 0);
}

RETRAINER_TEST(joining_nothing_gives_an_empty_string, "cpp.std.strings") {
    RETRAINER_ASSERT_INT((int)join({}, ',').size(), 0);
}

RETRAINER_TEST(joining_one_field_adds_no_separator, "cpp.std.strings") {
    const std::vector<std::string_view> parts{"solo"};
    const std::string joined = join(parts, ',');
    RETRAINER_ASSERT_STR(joined.c_str(), "solo");
}

RETRAINER_TEST(an_empty_prefix_matches_anything, "cpp.std.strings") {
    // Every string starts with nothing, which is the mathematically correct
    // and frequently surprising answer.
    const std::vector<std::string_view> prefixes{""};
    RETRAINER_ASSERT(starts_with_any("anything", prefixes), "the empty prefix matches");
}

RETRAINER_TEST(no_prefixes_match_nothing, "cpp.std.strings") {
    RETRAINER_ASSERT(!starts_with_any("anything", {}), "an empty list matches nothing");
}

RETRAINER_TEST(a_prefix_longer_than_the_text_does_not_match, "cpp.std.strings") {
    const std::vector<std::string_view> prefixes{"longer than"};
    RETRAINER_ASSERT(!starts_with_any("short", prefixes), "and does not read past the end");
}
