// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <limits.h>

#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(ordinary_additions_are_safe, "c.build.undefined") {
    RETRAINER_ASSERT_INT(can_add(1, 2), 1);
    RETRAINER_ASSERT_INT(can_add(-5, 3), 1);
    RETRAINER_ASSERT_INT(can_add(0, INT_MAX), 1);
    RETRAINER_ASSERT_INT(can_add(INT_MIN, 0), 1);
}

RETRAINER_TEST(the_overflowing_additions_are_refused, "c.build.undefined") {
    RETRAINER_ASSERT_INT(can_add(INT_MAX, 1), 0);
    RETRAINER_ASSERT_INT(can_add(INT_MIN, -1), 0);
    RETRAINER_ASSERT_INT(can_add(INT_MAX / 2 + 1, INT_MAX / 2 + 1), 0);
}

RETRAINER_TEST(multiplication_limits_are_respected, "c.build.undefined") {
    RETRAINER_ASSERT_INT(can_multiply(46341, 46341), 0);
    RETRAINER_ASSERT_INT(can_multiply(46340, 46340), 1);
    RETRAINER_ASSERT_INT(can_multiply(0, INT_MAX), 1);
    RETRAINER_ASSERT_INT(can_multiply(INT_MAX, 1), 1);
}

RETRAINER_TEST(checked_sum_sums_when_safe, "c.build.undefined") {
    int values[] = {10, 20, 30};
    int total = 0;
    RETRAINER_ASSERT_INT(checked_sum(values, 3, &total), 1);
    RETRAINER_ASSERT_INT(total, 60);
}

RETRAINER_TEST(padded_size_rounds_up, "c.structs.layout") {
    RETRAINER_ASSERT_INT((int)padded_size(5, 4), 8);
    RETRAINER_ASSERT_INT((int)padded_size(8, 4), 8);
    RETRAINER_ASSERT_INT((int)padded_size(9, 8), 16);
}
