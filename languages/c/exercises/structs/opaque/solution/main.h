// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

/**
 * A stopwatch, opaque on purpose: the fields live in main.c and nothing
 * outside it can see, size or copy them. Hold a pointer; call functions.
 */
typedef struct Stopwatch Stopwatch;

/** A fresh stopwatch on the heap, or NULL. The caller destroys it. */
Stopwatch *stopwatch_create(void);

/** Add a lap. Negative seconds are ignored. */
void stopwatch_record(Stopwatch *watch, int seconds);

/** Total recorded seconds; 0 for NULL. */
int stopwatch_total(const Stopwatch *watch);

/** How many laps were recorded; 0 for NULL. */
int stopwatch_laps(const Stopwatch *watch);

/** Free the stopwatch. NULL is a no-op, like free itself. */
void stopwatch_destroy(Stopwatch *watch);

#endif /* MAIN_H */
