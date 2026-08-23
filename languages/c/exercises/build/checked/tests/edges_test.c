// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <limits.h>
#include <stddef.h>

#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(the_division_corner_is_handled, "c.build.undefined") {
    /* INT_MIN * -1 overflows — and so does the division a naive check
       would use to detect it. */
    RETRAINER_ASSERT_INT(can_multiply(INT_MIN, -1), 0);
    RETRAINER_ASSERT_INT(can_multiply(-1, INT_MIN), 0);
    RETRAINER_ASSERT_INT(can_multiply(INT_MIN, 1), 1);
}

RETRAINER_TEST(mixed_signs_overflow_downward, "c.build.undefined") {
    RETRAINER_ASSERT_INT(can_multiply(INT_MAX, -2), 0);
    RETRAINER_ASSERT_INT(can_multiply(-2, INT_MAX), 0);
    RETRAINER_ASSERT_INT(can_multiply(INT_MIN / 2, 2), 1);
}

RETRAINER_TEST(checked_sum_refuses_and_leaves_out_alone, "c.build.undefined") {
    int values[] = {INT_MAX, 1};
    int total = 123;
    RETRAINER_ASSERT_INT(checked_sum(values, 2, &total), 0);
    RETRAINER_ASSERT_INT(total, 123);
}

RETRAINER_TEST(an_empty_checked_sum_is_zero, "c.build.undefined") {
    int total = 99;
    RETRAINER_ASSERT_INT(checked_sum(NULL, 0, &total), 1);
    RETRAINER_ASSERT_INT(total, 0);
}

RETRAINER_TEST(padding_matches_a_real_struct, "c.structs.layout") {
    /* char (1) + int (4): the compiler pads to 8, and so must the rule. */
    struct CharThenInt {
        char c;
        int n;
    };
    RETRAINER_ASSERT_INT((int)sizeof(struct CharThenInt),
                         (int)padded_size(sizeof(char) + 3 + sizeof(int) - 3, sizeof(int)));

    struct IntThenChar {
        int n;
        char c;
    };
    RETRAINER_ASSERT_INT((int)sizeof(struct IntThenChar),
                         (int)padded_size(sizeof(int) + sizeof(char), sizeof(int)));
}
