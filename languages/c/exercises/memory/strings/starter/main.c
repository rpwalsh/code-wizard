// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdlib.h>
#include <string.h>

/** A heap copy of `text`, or NULL. The caller frees it. */
char *duplicate(const char *text) {
    (void)text;
    return NULL;
}

/** Copy what fits, always terminate, return characters written. */
size_t copy_into(char *destination, size_t capacity, const char *text) {
    (void)destination;
    (void)capacity;
    (void)text;
    return 0;
}

/** `left` and `right` joined, on the heap, or NULL. */
char *join(const char *left, const char *right) {
    (void)left;
    (void)right;
    return NULL;
}
