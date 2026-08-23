// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdlib.h>

const int *find_value(const int *begin, const int *end, int wanted) {
    for (const int *cursor = begin; cursor != end; cursor += 1) {
        if (*cursor == wanted) {
            return cursor;
        }
    }
    /* end, not NULL: absence stays inside the range's own vocabulary, and
       the caller compares against the end it already holds. */
    return end;
}

void reverse_in_place(int *values, size_t length) {
    if (length == 0) {
        return;
    }

    int *left = values;
    int *right = values + length - 1;
    while (left < right) {
        int held = *left;
        *left = *right;
        *right = held;
        left += 1;
        right -= 1;
    }
}

int *copy_reversed(const int *values, size_t length) {
    if (length == 0) {
        return NULL;
    }

    /* Heap, because the result must outlive this call. A local array here
       would die with the return, and the caller would hold a corpse. */
    int *copy = malloc(length * sizeof *copy);
    if (copy == NULL) {
        return NULL;
    }

    for (size_t index = 0; index < length; index += 1) {
        copy[index] = values[length - 1 - index];
    }
    return copy;
}

long sum_range(const int *begin, const int *end) {
    long total = 0;
    for (const int *cursor = begin; cursor != end; cursor += 1) {
        total += *cursor;
    }
    return total;
}
