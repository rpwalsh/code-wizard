// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_field_is_read_out_of_the_record, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field("id=7,qty=12,cost=350", "qty"), 12);
    RETRAINER_ASSERT_INT(read_field("id=7,qty=12,cost=350", "id"), 7);
    RETRAINER_ASSERT_INT(read_field("id=7,qty=12,cost=350", "cost"), 350);
}

RETRAINER_TEST(a_missing_field_throws_missing_field, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("id=7", "qty");
    } catch (const MissingField &error) {
        caught = true;
        RETRAINER_ASSERT_STR(error.field(), "qty");
    }
    RETRAINER_ASSERT(caught, "a missing field is a MissingField");
}

RETRAINER_TEST(an_unreadable_field_throws_bad_value, "cpp.errors.exceptions") {
    bool caught = false;
    try {
        read_field("qty=twelve", "qty");
    } catch (const BadValue &error) {
        caught = true;
        RETRAINER_ASSERT_STR(error.field(), "qty");
        RETRAINER_ASSERT_STR(error.text(), "twelve");
    }
    RETRAINER_ASSERT(caught, "an unreadable field is a BadValue");
}

RETRAINER_TEST(the_message_travels_with_the_exception, "cpp.errors.exceptions") {
    // what() is what a handler that knows nothing about these types will see,
    // so it has to say something on its own.
    try {
        read_field("id=7", "qty");
    } catch (const std::exception &error) {
        RETRAINER_ASSERT_STR(error.what(), "missing field: qty");
    }
}

RETRAINER_TEST(a_fallback_covers_a_missing_field, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_INT(read_field_or("id=7", "qty", 1), 1);
    RETRAINER_ASSERT_INT(read_field_or("id=7,qty=12", "qty", 1), 12);
}

RETRAINER_TEST(a_fallback_does_not_cover_an_unreadable_field, "cpp.errors.exceptions") {
    // A default for absent is a decision. A default for unreadable is a way
    // of not noticing that the data is wrong.
    bool caught = false;
    try {
        read_field_or("qty=twelve", "qty", 1);
    } catch (const BadValue &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "BadValue passes straight through");
}

RETRAINER_TEST(each_outcome_is_diagnosed_differently, "cpp.errors.exceptions") {
    RETRAINER_ASSERT_STR(diagnose("qty=12", "qty"), "ok: 12");
    RETRAINER_ASSERT_STR(diagnose("id=7", "qty"), "missing qty");
    RETRAINER_ASSERT_STR(diagnose("qty=twelve", "qty"), "bad qty: twelve");
}
