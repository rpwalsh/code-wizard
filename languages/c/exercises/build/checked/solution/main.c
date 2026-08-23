// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <limits.h>

int can_add(int a, int b) {
    /* Decided from the operands: the right-hand sides stay in range, so
       nothing here is undefined for the compiler to exploit. The naive
       `a + b < a` performs the very overflow it is checking. */
    if (b > 0) {
        return a <= INT_MAX - b;
    }
    if (b < 0) {
        return a >= INT_MIN - b;
    }
    return 1;
}

int can_multiply(int a, int b) {
    if (a == 0 || b == 0) {
        return 1;
    }
    /* INT_MIN / -1 overflows division itself; dispatch it before dividing. */
    if (a == -1) {
        return b != INT_MIN;
    }
    if (b == -1) {
        return a != INT_MIN;
    }

    if (a > 0 && b > 0) {
        return a <= INT_MAX / b;
    }
    if (a < 0 && b < 0) {
        /* Dividing by a negative flips the comparison. */
        return a >= INT_MAX / b;
    }
    if (a > 0) {
        return b >= INT_MIN / a;
    }
    return a >= INT_MIN / b;
}

int checked_sum(const int *values, size_t length, int *out) {
    int total = 0;
    for (size_t index = 0; index < length; index += 1) {
        if (!can_add(total, values[index])) {
            return 0;
        }
        total += values[index];
    }
    *out = total;
    return 1;
}

size_t padded_size(size_t members, size_t largest) {
    if (largest == 0) {
        return members;
    }
    /* Integer round-up: the struct is padded to a multiple of its
       strictest member so that arrays of it stay aligned. */
    return (members + largest - 1) / largest * largest;
}
