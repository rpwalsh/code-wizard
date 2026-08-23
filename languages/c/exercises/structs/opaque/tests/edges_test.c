// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(negative_time_is_ignored_entirely, "c.structs.definition") {
    Stopwatch *watch = stopwatch_create();
    stopwatch_record(watch, -5);
    RETRAINER_ASSERT_INT(stopwatch_total(watch), 0);
    /* Not even the lap counts: an ignored lap is ignored everywhere. */
    RETRAINER_ASSERT_INT(stopwatch_laps(watch), 0);
    stopwatch_destroy(watch);
}

RETRAINER_TEST(accessors_are_safe_on_null, "c.build.headers") {
    RETRAINER_ASSERT_INT(stopwatch_total(NULL), 0);
    RETRAINER_ASSERT_INT(stopwatch_laps(NULL), 0);
}

RETRAINER_TEST(destroying_null_is_a_no_op, "c.build.headers") {
    stopwatch_destroy(NULL);
    RETRAINER_ASSERT(1, "destroy(NULL) must not crash");
}

RETRAINER_TEST(recording_on_null_is_ignored, "c.build.headers") {
    stopwatch_record(NULL, 10);
    RETRAINER_ASSERT(1, "record(NULL) must not crash");
}

RETRAINER_TEST(a_zero_second_lap_still_counts, "c.structs.definition") {
    Stopwatch *watch = stopwatch_create();
    stopwatch_record(watch, 0);
    RETRAINER_ASSERT_INT(stopwatch_laps(watch), 1);
    RETRAINER_ASSERT_INT(stopwatch_total(watch), 0);
    stopwatch_destroy(watch);
}
