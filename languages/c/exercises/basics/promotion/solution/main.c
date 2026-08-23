// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

int midpoint(int low, int high) {
    /* (low + high) / 2 overflows when the sum leaves int, even though the
       answer would fit. Every intermediate here stays inside [low, high]. */
    return low + (high - low) / 2;
}

int clamp(int value, int lowest, int highest) {
    if (value < lowest) {
        return lowest;
    }
    if (value > highest) {
        return highest;
    }
    return value;
}

size_t count_between(const int *values, size_t length, int low, int high) {
    size_t count = 0;
    /* Counting up: a size_t counting down past zero wraps to SIZE_MAX and
       the loop never ends. Unsigned is modular arithmetic, not big int. */
    for (size_t index = 0; index < length; index += 1) {
        if (values[index] >= low && values[index] <= high) {
            count += 1;
        }
    }
    return count;
}

int average_sign(const int *values, size_t length) {
    /* Promote before accumulating: an int sum overflows long before a big
       array ends, and signed overflow is undefined behavior, not wrapping. */
    long long total = 0;
    for (size_t index = 0; index < length; index += 1) {
        total += values[index];
    }
    return (total > 0) - (total < 0);
}
