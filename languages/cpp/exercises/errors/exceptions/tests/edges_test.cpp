// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_record_is_missing_everything, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("", "qty");
    } catch (const MissingField &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "nothing contains no fields");
}

RETRAINER_TEST(a_negative_number_is_a_number, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field("balance=-250", "balance"), -250);
}

RETRAINER_TEST(a_lone_minus_sign_is_not, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("balance=-", "balance");
    } catch (const BadValue &error) {
        caught = true;
        RETRAINER_ASSERT_STR(error.text(), "-");
    }
    RETRAINER_ASSERT(caught, "a sign with no digits is not a number");
}

RETRAINER_TEST(an_empty_value_is_present_and_unreadable, "cpp.errors.exceptions") {
    // Present-but-empty is not the same as absent, and the two failures are
    // fixed in different places by different people.
    bool caught = false;
    try {
        read_field("qty=", "qty");
    } catch (const BadValue &error) {
        caught = true;
        RETRAINER_ASSERT_STR(error.text(), "");
    }
    RETRAINER_ASSERT(caught, "an empty value is a BadValue");
}

RETRAINER_TEST(a_value_with_a_space_is_unreadable, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("qty= 12", "qty");
    } catch (const BadValue &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "the space is part of the value");
}

RETRAINER_TEST(a_key_is_matched_whole_not_as_a_prefix, "cpp.errors.exceptions") {
    // "qty" must not match "quantity". Prefix matching here would read the
    // wrong column and never fail loudly enough to be noticed.
    RETRAINER_ASSERT_INT(read_field("quantity=99,qty=3", "qty"), 3);
    RETRAINER_ASSERT_INT(read_field("quantity=99,qty=3", "quantity"), 99);
}

RETRAINER_TEST(an_entry_with_no_equals_sign_is_not_a_field, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("flag,qty=3", "flag");
    } catch (const MissingField &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "a bare word names no field");
    RETRAINER_ASSERT_INT(read_field("flag,qty=3", "qty"), 3);
}

RETRAINER_TEST(the_first_of_two_entries_with_the_same_key_wins, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field("qty=3,qty=9", "qty"), 3);
}

RETRAINER_TEST(a_trailing_comma_does_not_invent_a_field, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field("qty=3,", "qty"), 3);
    bool caught = false;
    try {
        read_field("qty=3,", "");
    } catch (const MissingField &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "the empty tail is not an entry");
}

RETRAINER_TEST(the_thrown_object_keeps_its_real_type, "cpp.errors.exceptions") {
    // Caught by base reference, and still a MissingField. Catching by value
    // instead would slice the object down to its base and lose field().
    try {
        read_field("id=7", "qty");
    } catch (const std::exception &error) {
        RETRAINER_ASSERT(dynamic_cast<const MissingField *>(&error) != nullptr,
                         "still a MissingField through a base reference");
        RETRAINER_ASSERT(dynamic_cast<const BadValue *>(&error) == nullptr,
                         "and not the other one");
    }
}

RETRAINER_TEST(zero_is_a_perfectly_good_value, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field("qty=0", "qty"), 0);
    RETRAINER_ASSERT_STR(diagnose("qty=0", "qty"), "ok: 0");
}

RETRAINER_TEST(a_fallback_of_zero_is_still_a_fallback, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field_or("id=1", "qty", 0), 0);
}

RETRAINER_TEST(a_value_that_goes_bad_after_the_first_digit_is_still_bad,
               "cpp.errors.exceptions") {
    // Checking only where the trouble usually is — the first character —
    // accepts "1a" and then reads it as some number nobody typed.
    bool caught = false;
    try {
        read_field("qty=1a", "qty");
    } catch (const BadValue &error) {
        caught = true;
        RETRAINER_ASSERT_STR(error.text(), "1a");
    }
    RETRAINER_ASSERT(caught, "the digit at the front proves nothing");
}

RETRAINER_TEST(every_character_of_a_long_value_is_checked, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("qty=1234x6", "qty");
    } catch (const BadValue &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "the bad character is in the middle");

    bool negative_caught = false;
    try {
        read_field("qty=-12y", "qty");
    } catch (const BadValue &) {
        negative_caught = true;
    }
    RETRAINER_ASSERT(negative_caught, "the sign does not excuse the rest");
}
