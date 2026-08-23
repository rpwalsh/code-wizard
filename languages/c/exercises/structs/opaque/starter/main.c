// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdlib.h>

/* Define struct Stopwatch here — this file is the only place that sees it. */

Stopwatch *stopwatch_create(void) {
    return NULL;
}

void stopwatch_record(Stopwatch *watch, int seconds) {
    (void)watch;
    (void)seconds;
}

int stopwatch_total(const Stopwatch *watch) {
    (void)watch;
    return -1;
}

int stopwatch_laps(const Stopwatch *watch) {
    (void)watch;
    return -1;
}

void stopwatch_destroy(Stopwatch *watch) {
    (void)watch;
}
