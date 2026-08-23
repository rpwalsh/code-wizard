// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

#include <stddef.h>

/** A heap copy of `text`, or NULL. The caller frees it. */
char *duplicate(const char *text);

/** Copy what fits, always terminate, return characters written. */
size_t copy_into(char *destination, size_t capacity, const char *text);

/** `left` and `right` joined, on the heap, or NULL. */
char *join(const char *left, const char *right);

#endif /* MAIN_H */
