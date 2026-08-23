// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdlib.h>

/* The one translation unit that knows the layout. Reorder, rename or
   replace these fields and no caller can notice, because no caller could
   ever depend on them. */
struct Stopwatch {
    int total;
    int laps;
};

Stopwatch *stopwatch_create(void) {
    Stopwatch *watch = malloc(sizeof *watch);
    if (watch == NULL) {
        return NULL;
    }
    watch->total = 0;
    watch->laps = 0;
    return watch;
}

void stopwatch_record(Stopwatch *watch, int seconds) {
    if (watch == NULL || seconds < 0) {
        return;
    }
    watch->total += seconds;
    watch->laps += 1;
}

int stopwatch_total(const Stopwatch *watch) {
    /* Safe on NULL by convention, so cleanup paths need no guard. */
    return watch == NULL ? 0 : watch->total;
}

int stopwatch_laps(const Stopwatch *watch) {
    return watch == NULL ? 0 : watch->laps;
}

void stopwatch_destroy(Stopwatch *watch) {
    /* free already accepts NULL; matching it keeps the type native. */
    free(watch);
}
