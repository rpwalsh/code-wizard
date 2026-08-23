// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <limits.h>

#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(midpoint_survives_the_top_of_the_range, "c.basics.types") {
    /* (low + high) / 2 overflows here; the safe form does not. */
    RETRAINER_ASSERT_INT(midpoint(INT_MAX - 1, INT_MAX), INT_MAX - 1);
    RETRAINER_ASSERT_INT(midpoint(INT_MAX, INT_MAX), INT_MAX);
}

RETRAINER_TEST(midpoint_survives_two_large_values, "c.basics.types") {
    RETRAINER_ASSERT_INT(midpoint(2000000000, 2100000000), 2050000000);
}

RETRAINER_TEST(an_empty_array_counts_nothing, "c.basics.control") {
    /* length - 1 on this input, in a size_t, is the largest value the type
       holds — the down-counting loop never ends. Up-counting is fine. */
    RETRAINER_ASSERT_INT((int)count_between(NULL, 0, 0, 100), 0);
    RETRAINER_ASSERT_INT(average_sign(NULL, 0), 0);
}

RETRAINER_TEST(a_sum_too_big_for_int_keeps_its_sign, "c.basics.types") {
    /* Three of these overflow an int sum; a long long holds them easily. */
    int big[] = {2000000000, 2000000000, 2000000000};
    RETRAINER_ASSERT_INT(average_sign(big, 3), 1);

    int negative[] = {-2000000000, -2000000000, -2000000000};
    RETRAINER_ASSERT_INT(average_sign(negative, 3), -1);
}
