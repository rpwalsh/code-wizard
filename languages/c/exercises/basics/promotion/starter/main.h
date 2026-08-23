// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

#include <stddef.h>

/** The midpoint of [low, high], safe from overflow. low <= high. */
int midpoint(int low, int high);

/** value forced into [lowest, highest], bounds inclusive. */
int clamp(int value, int lowest, int highest);

/** How many elements fall in [low, high], inclusive. */
size_t count_between(const int *values, size_t length, int low, int high);

/** -1, 0 or 1: the sign of the sum. Empty arrays sum to 0. */
int average_sign(const int *values, size_t length);

#endif /* MAIN_H */
