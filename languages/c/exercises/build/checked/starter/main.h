// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

#include <stddef.h>

/** 1 when a + b fits in int, decided without performing it. */
int can_add(int a, int b);

/** 1 when a * b fits in int, decided without performing it. */
int can_multiply(int a, int b);

/** Sum with overflow checks: 1 and *out on success, 0 on would-overflow. */
int checked_sum(const int *values, size_t length, int *out);

/** members rounded up to a multiple of largest (struct padding rule). */
size_t padded_size(size_t members, size_t largest);

#endif /* MAIN_H */
