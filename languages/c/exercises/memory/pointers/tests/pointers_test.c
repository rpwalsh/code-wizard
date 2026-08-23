// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(find_returns_the_first_hit, "c.memory.pointers") {
    int values[] = {4, 7, 7, 9};
    const int *found = find_value(values, values + 4, 7);
    RETRAINER_ASSERT(found == values + 1, "expected the first 7");
    RETRAINER_ASSERT_INT(*found, 7);
}

RETRAINER_TEST(find_misses_with_end, "c.memory.pointers") {
    int values[] = {1, 2, 3};
    RETRAINER_ASSERT(find_value(values, values + 3, 9) == values + 3,
                     "absence is the end pointer, not NULL");
}

RETRAINER_TEST(reverse_in_place_reverses, "c.memory.arrays") {
    int values[] = {1, 2, 3, 4, 5};
    reverse_in_place(values, 5);
    RETRAINER_ASSERT_INT(values[0], 5);
    RETRAINER_ASSERT_INT(values[2], 3);
    RETRAINER_ASSERT_INT(values[4], 1);
}

RETRAINER_TEST(copy_reversed_leaves_the_source_alone, "c.memory.stack-heap") {
    int values[] = {1, 2, 3};
    int *copy = copy_reversed(values, 3);
    RETRAINER_ASSERT(copy != NULL, "expected a heap copy");
    RETRAINER_ASSERT_INT(copy[0], 3);
    RETRAINER_ASSERT_INT(copy[2], 1);
    RETRAINER_ASSERT_INT(values[0], 1);
    free(copy);
}

RETRAINER_TEST(sum_range_walks_the_range, "c.memory.pointers") {
    int values[] = {10, 20, 30};
    RETRAINER_ASSERT_INT((int)sum_range(values, values + 3), 60);
}
