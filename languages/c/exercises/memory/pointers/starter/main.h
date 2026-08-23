// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

#include <stddef.h>

/** First pointer in [begin, end) whose element equals wanted, else end. */
const int *find_value(const int *begin, const int *end, int wanted);

/** Reverse the array in place. */
void reverse_in_place(int *values, size_t length);

/** A new heap array with the values reversed; NULL on failure or length 0.
    The caller frees it. */
int *copy_reversed(const int *values, size_t length);

/** The sum of [begin, end). Empty ranges sum to 0. */
long sum_range(const int *begin, const int *end);

#endif /* MAIN_H */
