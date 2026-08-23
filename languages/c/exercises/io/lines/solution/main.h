// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

#include <stddef.h>

/** Lines in the file through out; 0 on success, -1 if it cannot open. */
int count_lines(const char *path, int *out);

/** Longest line into buffer (NUL-terminated, truncated to capacity).
    Returns the true length, or -1 if the file cannot open. */
int longest_line(const char *path, char *buffer, size_t capacity);

/** Sum one-integer-per-line into out; 0 ok, -1 open failure, -2 bad line. */
int sum_numbers(const char *path, long *out);

#endif /* MAIN_H */
