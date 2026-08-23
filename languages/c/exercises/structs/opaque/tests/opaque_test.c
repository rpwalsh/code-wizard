// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(a_fresh_stopwatch_is_zeroed, "c.structs.opaque") {
    Stopwatch *watch = stopwatch_create();
    RETRAINER_ASSERT(watch != NULL, "create should allocate");
    RETRAINER_ASSERT_INT(stopwatch_total(watch), 0);
    RETRAINER_ASSERT_INT(stopwatch_laps(watch), 0);
    stopwatch_destroy(watch);
}

RETRAINER_TEST(laps_accumulate, "c.structs.definition") {
    Stopwatch *watch = stopwatch_create();
    stopwatch_record(watch, 30);
    stopwatch_record(watch, 45);
    RETRAINER_ASSERT_INT(stopwatch_total(watch), 75);
    RETRAINER_ASSERT_INT(stopwatch_laps(watch), 2);
    stopwatch_destroy(watch);
}

RETRAINER_TEST(two_stopwatches_are_independent, "c.structs.opaque") {
    Stopwatch *first = stopwatch_create();
    Stopwatch *second = stopwatch_create();
    stopwatch_record(first, 10);
    RETRAINER_ASSERT_INT(stopwatch_total(second), 0);
    RETRAINER_ASSERT_INT(stopwatch_total(first), 10);
    stopwatch_destroy(first);
    stopwatch_destroy(second);
}
