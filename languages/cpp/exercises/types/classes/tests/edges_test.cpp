// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(ten_comes_after_nine, "cpp.types.classes") {
    // The reason a version is three numbers and not a string. Compared as
    // text, "1.10.0" sorts before "1.9.0", because the character '1' is less
    // than the character '9' and the comparison stops caring after that.
    RETRAINER_ASSERT(Version(1, 9, 0).is_before(Version(1, 10, 0)), "nine before ten");
    RETRAINER_ASSERT(!Version(1, 10, 0).is_before(Version(1, 9, 0)), "and not the reverse");
    RETRAINER_ASSERT(Version(9, 0, 0).is_before(Version(10, 0, 0)), "the same at the front");
    RETRAINER_ASSERT(Version(1, 1, 9).is_before(Version(1, 1, 10)), "and at the back");
}

RETRAINER_TEST(a_version_is_not_before_itself, "cpp.types.classes") {
    // Strictly before. A comparison that says a thing precedes itself will
    // make any sort built on it misbehave in ways nobody traces back here.
    const Version version(1, 2, 3);
    RETRAINER_ASSERT(!version.is_before(version), "nothing precedes itself");
    RETRAINER_ASSERT(!Version(0, 0, 0).is_before(Version(0, 0, 0)), "zero included");
}

RETRAINER_TEST(a_later_major_wins_over_everything_below_it, "cpp.types.classes") {
    // 2.0.0 is after 1.99.99. Adding the parts together, or comparing them in
    // the wrong order, gets this backwards.
    RETRAINER_ASSERT(Version(1, 99, 99).is_before(Version(2, 0, 0)), "major decides first");
    RETRAINER_ASSERT(!Version(2, 0, 0).is_before(Version(1, 99, 99)), "and decides alone");
}

RETRAINER_TEST(a_later_minor_wins_over_the_patch, "cpp.types.classes") {
    RETRAINER_ASSERT(Version(1, 2, 99).is_before(Version(1, 3, 0)), "minor beats patch");
}

RETRAINER_TEST(parsing_refuses_the_wrong_number_of_parts, "cpp.types.classes") {
    const std::string bad[] = {"1", "1.2", "1.2.3.4", ""};
    for (const std::string &text : bad) {
        bool caught = false;
        try {
            const Version version(text);
            (void)version;
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "three parts, no more and no fewer");
    }
}

RETRAINER_TEST(parsing_refuses_parts_that_are_not_numbers, "cpp.types.classes") {
    const std::string bad[] = {"1.x.3", "1..3", "1.2.", ".2.3", "1.2.3a", "-1.2.3"};
    for (const std::string &text : bad) {
        bool caught = false;
        try {
            const Version version(text);
            (void)version;
        } catch (const std::invalid_argument &) {
            caught = true;
        }
        RETRAINER_ASSERT(caught, "every part has to be digits");
    }
}

RETRAINER_TEST(the_message_says_what_was_refused, "cpp.types.classes") {
    try {
        const Version version("1.2");
        (void)version;
    } catch (const std::invalid_argument &error) {
        RETRAINER_ASSERT_STR(error.what(), "not a version: 1.2");
    }
}

RETRAINER_TEST(leading_zeros_are_digits_like_any_other, "cpp.types.classes") {
    const Version version("01.02.03");
    RETRAINER_ASSERT_INT(version.major_number(), 1);
    RETRAINER_ASSERT_INT(version.minor_number(), 2);
    RETRAINER_ASSERT_INT(version.patch_number(), 3);
    RETRAINER_ASSERT_STR(version.text(), "1.2.3");
}

RETRAINER_TEST(a_parsed_version_equals_the_one_built_by_hand, "cpp.types.classes") {
    RETRAINER_ASSERT(Version("7.8.9") == Version(7, 8, 9), "same version, two routes in");
}

RETRAINER_TEST(equality_looks_at_all_three_parts, "cpp.types.classes") {
    RETRAINER_ASSERT(!(Version(1, 2, 3) == Version(9, 2, 3)), "the first part counts");
    RETRAINER_ASSERT(!(Version(1, 2, 3) == Version(1, 9, 3)), "the second counts");
    RETRAINER_ASSERT(!(Version(1, 2, 3) == Version(1, 2, 9)), "the third counts");
}

RETRAINER_TEST(large_parts_survive_the_round_trip, "cpp.types.classes") {
    const Version version("123.456.789");
    RETRAINER_ASSERT_STR(version.text(), "123.456.789");
}
