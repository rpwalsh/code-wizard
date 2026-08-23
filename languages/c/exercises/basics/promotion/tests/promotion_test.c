// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(midpoint_of_a_small_range, "c.basics.functions") {
    RETRAINER_ASSERT_INT(midpoint(2, 10), 6);
    RETRAINER_ASSERT_INT(midpoint(5, 5), 5);
    RETRAINER_ASSERT_INT(midpoint(0, 1), 0);
}

RETRAINER_TEST(clamp_forces_the_range, "c.basics.control") {
    RETRAINER_ASSERT_INT(clamp(15, 0, 10), 10);
    RETRAINER_ASSERT_INT(clamp(-3, 0, 10), 0);
    RETRAINER_ASSERT_INT(clamp(7, 0, 10), 7);
    RETRAINER_ASSERT_INT(clamp(0, 0, 10), 0);
    RETRAINER_ASSERT_INT(clamp(10, 0, 10), 10);
}

RETRAINER_TEST(count_between_counts_inclusively, "c.basics.control") {
    int values[] = {1, 5, 10, 15, 20};
    RETRAINER_ASSERT_INT((int)count_between(values, 5, 5, 15), 3);
    RETRAINER_ASSERT_INT((int)count_between(values, 5, 100, 200), 0);
}

RETRAINER_TEST(average_sign_reports_the_sum, "c.basics.types") {
    int positive[] = {3, -1, 2};
    int negative[] = {-3, 1, -2};
    int zero[] = {5, -5};
    RETRAINER_ASSERT_INT(average_sign(positive, 3), 1);
    RETRAINER_ASSERT_INT(average_sign(negative, 3), -1);
    RETRAINER_ASSERT_INT(average_sign(zero, 2), 0);
}
