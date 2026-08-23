// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(duplicates_a_string, "c.memory.strings") {
    char *copy = duplicate("hello");
    RETRAINER_ASSERT(copy != NULL, "duplicate returned NULL");
    RETRAINER_ASSERT_STR(copy, "hello");
    free(copy);
}

RETRAINER_TEST(copies_into_a_large_enough_buffer, "c.memory.strings") {
    char buffer[16];
    size_t written = copy_into(buffer, sizeof buffer, "hello");
    RETRAINER_ASSERT_INT(written, 5);
    RETRAINER_ASSERT_STR(buffer, "hello");
}

RETRAINER_TEST(joins_two_strings, "c.memory.malloc") {
    char *joined = join("ab", "cd");
    RETRAINER_ASSERT(joined != NULL, "join returned NULL");
    RETRAINER_ASSERT_STR(joined, "abcd");
    free(joined);
}
