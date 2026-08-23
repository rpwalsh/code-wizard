// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdlib.h>
#include <string.h>

/**
 * A heap copy of `text`, or NULL.
 *
 * The `+ 1` is the terminator. Without it this is the commonest single-byte
 * heap overflow in the language, and it usually appears to work.
 */
char *duplicate(const char *text) {
    if (text == NULL) return NULL;

    size_t length = strlen(text);
    char *copy = malloc(length + 1);
    if (copy == NULL) return NULL;

    memcpy(copy, text, length + 1);
    return copy;
}

/**
 * Copy what fits and always terminate.
 *
 * The interface `strncpy` should have had: it returns what it wrote, and it
 * never leaves the destination unterminated.
 */
size_t copy_into(char *destination, size_t capacity, const char *text) {
    if (destination == NULL || capacity == 0) return 0;
    if (text == NULL) {
        destination[0] = '\0';
        return 0;
    }

    size_t length = strlen(text);
    size_t room = capacity - 1;
    size_t written = length < room ? length : room;

    memcpy(destination, text, written);
    destination[written] = '\0';
    return written;
}

char *join(const char *left, const char *right) {
    if (left == NULL || right == NULL) return NULL;

    size_t left_length = strlen(left);
    size_t right_length = strlen(right);

    char *joined = malloc(left_length + right_length + 1);
    if (joined == NULL) return NULL;

    memcpy(joined, left, left_length);
    memcpy(joined + left_length, right, right_length + 1);
    return joined;
}
