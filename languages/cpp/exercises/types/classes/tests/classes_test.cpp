// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(the_three_parts_are_kept, "cpp.types.classes") {
    const Version version(1, 2, 3);
    RETRAINER_ASSERT_INT(version.major_number(), 1);
    RETRAINER_ASSERT_INT(version.minor_number(), 2);
    RETRAINER_ASSERT_INT(version.patch_number(), 3);
}

RETRAINER_TEST(the_default_version_is_zero, "cpp.types.classes") {
    const Version version;
    RETRAINER_ASSERT_INT(version.major_number(), 0);
    RETRAINER_ASSERT_INT(version.minor_number(), 0);
    RETRAINER_ASSERT_INT(version.patch_number(), 0);
    RETRAINER_ASSERT_STR(version.text(), "0.0.0");
}

RETRAINER_TEST(a_version_reads_back_as_it_was_written, "cpp.types.classes") {
    RETRAINER_ASSERT_STR(Version(1, 2, 3).text(), "1.2.3");
    RETRAINER_ASSERT_STR(Version(10, 20, 30).text(), "10.20.30");
}

RETRAINER_TEST(text_is_parsed_into_parts, "cpp.types.classes") {
    const Version version("4.5.6");
    RETRAINER_ASSERT_INT(version.major_number(), 4);
    RETRAINER_ASSERT_INT(version.minor_number(), 5);
    RETRAINER_ASSERT_INT(version.patch_number(), 6);
}

RETRAINER_TEST(nonsense_is_refused, "cpp.types.classes") {
    bool caught = false;
    try {
        const Version version("banana");
        (void)version;
    } catch (const std::invalid_argument &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "a fruit is not a version");
}

RETRAINER_TEST(ordering_runs_most_significant_part_first, "cpp.types.classes") {
    RETRAINER_ASSERT(Version(1, 0, 0).is_before(Version(2, 0, 0)), "one before two");
    RETRAINER_ASSERT(Version(1, 2, 0).is_before(Version(1, 3, 0)), "two before three");
    RETRAINER_ASSERT(Version(1, 2, 3).is_before(Version(1, 2, 4)), "three before four");
    RETRAINER_ASSERT(!Version(2, 0, 0).is_before(Version(1, 9, 9)), "and not backwards");
}

RETRAINER_TEST(two_equal_versions_are_equal, "cpp.types.classes") {
    RETRAINER_ASSERT(Version(1, 2, 3) == Version(1, 2, 3), "same parts, same version");
    RETRAINER_ASSERT(!(Version(1, 2, 3) == Version(1, 2, 4)), "one part apart is not equal");
}
