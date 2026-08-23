// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(a_full_buffer_is_still_terminated, "c.memory.strings") {
    char buffer[4] = {'x', 'x', 'x', 'x'};
    size_t written = copy_into(buffer, sizeof buffer, "abcdef");
    RETRAINER_ASSERT_INT(written, 3);
    RETRAINER_ASSERT_STR(buffer, "abc");
}

RETRAINER_TEST(zero_capacity_writes_nothing, "c.memory.strings") {
    char buffer[2] = {'z', 'z'};
    size_t written = copy_into(buffer, 0, "abc");
    RETRAINER_ASSERT_INT(written, 0);
    /* Not even a terminator: there is no byte we are allowed to write. */
    RETRAINER_ASSERT_INT(buffer[0], 'z');
}

RETRAINER_TEST(an_empty_string_duplicates, "c.memory.malloc") {
    char *copy = duplicate("");
    RETRAINER_ASSERT(copy != NULL, "duplicate returned NULL");
    RETRAINER_ASSERT_INT(copy[0], 0);
    free(copy);
}

RETRAINER_TEST(null_is_handled_rather_than_dereferenced, "c.errors.returns") {
    RETRAINER_ASSERT(duplicate(NULL) == NULL, "duplicate(NULL) should be NULL");
    RETRAINER_ASSERT(join(NULL, "a") == NULL, "join(NULL, ...) should be NULL");
    RETRAINER_ASSERT(join("a", NULL) == NULL, "join(..., NULL) should be NULL");
}

RETRAINER_TEST(joining_with_empty_strings, "c.memory.malloc") {
    char *joined = join("", "");
    RETRAINER_ASSERT(joined != NULL, "join returned NULL");
    RETRAINER_ASSERT_INT(joined[0], 0);
    free(joined);
}
