// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(an_empty_range_is_begin_equals_end, "c.memory.pointers") {
    int values[] = {1};
    RETRAINER_ASSERT_INT((int)sum_range(values, values), 0);
    RETRAINER_ASSERT(find_value(values, values, 1) == values,
                     "an empty range cannot contain anything");
}

RETRAINER_TEST(reversing_nothing_and_one_are_no_ops, "c.memory.arrays") {
    int one[] = {42};
    reverse_in_place(one, 1);
    RETRAINER_ASSERT_INT(one[0], 42);
    reverse_in_place(NULL, 0);
    RETRAINER_ASSERT(1, "reversing an empty array must not crash");
}

RETRAINER_TEST(an_even_length_reverses_cleanly, "c.memory.arrays") {
    int values[] = {1, 2, 3, 4};
    reverse_in_place(values, 4);
    RETRAINER_ASSERT_INT(values[0], 4);
    RETRAINER_ASSERT_INT(values[1], 3);
    RETRAINER_ASSERT_INT(values[2], 2);
    RETRAINER_ASSERT_INT(values[3], 1);
}

RETRAINER_TEST(copying_nothing_is_null_not_a_zero_byte_allocation, "c.memory.stack-heap") {
    RETRAINER_ASSERT(copy_reversed(NULL, 0) == NULL, "length 0 has no copy");
}

RETRAINER_TEST(negative_values_sum_like_any_other, "c.memory.pointers") {
    int values[] = {-5, 5, -7};
    RETRAINER_ASSERT_INT((int)sum_range(values, values + 3), -7);
}
