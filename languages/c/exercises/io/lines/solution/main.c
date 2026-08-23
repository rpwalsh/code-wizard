// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define LINE_MAX_BYTES 512

int count_lines(const char *path, int *out) {
    FILE *file = fopen(path, "r");
    if (file == NULL) {
        return -1;
    }

    int lines = 0;
    int saw_content_without_newline = 0;
    char chunk[LINE_MAX_BYTES];

    while (fgets(chunk, sizeof chunk, file) != NULL) {
        if (strchr(chunk, '\n') != NULL) {
            lines += 1;
            saw_content_without_newline = 0;
        } else {
            /* A long line arrives in several chunks; only the newline (or
               EOF after content) finishes it. */
            saw_content_without_newline = 1;
        }
    }
    if (saw_content_without_newline) {
        lines += 1;
    }

    fclose(file);
    *out = lines;
    return 0;
}

int longest_line(const char *path, char *buffer, size_t capacity) {
    FILE *file = fopen(path, "r");
    if (file == NULL) {
        return -1;
    }

    char chunk[LINE_MAX_BYTES];
    size_t best = 0;
    buffer[0] = '\0';

    while (fgets(chunk, sizeof chunk, file) != NULL) {
        size_t length = strcspn(chunk, "\n");
        if (length > best || (best == 0 && buffer[0] == '\0')) {
            if (length > best) {
                best = length;
            }
            /* Copy what fits, terminate always, report the truth below —
               the snprintf contract, applied by hand. */
            size_t copy = length < capacity - 1 ? length : capacity - 1;
            memcpy(buffer, chunk, copy);
            buffer[copy] = '\0';
        }
    }

    fclose(file);
    return (int)best;
}

int sum_numbers(const char *path, long *out) {
    FILE *file = fopen(path, "r");
    if (file == NULL) {
        return -1;
    }

    long total = 0;
    char chunk[LINE_MAX_BYTES];

    while (fgets(chunk, sizeof chunk, file) != NULL) {
        char *end = NULL;
        long value = strtol(chunk, &end, 10);

        /* The whole line must parse: end must have moved, and whatever
           remains may only be the newline. atoi could not tell us any
           of this — its 0 for garbage is the same 0 as a real zero. */
        if (end == chunk || (*end != '\0' && *end != '\n')) {
            fclose(file);
            return -2;
        }
        total += value;
    }

    fclose(file);
    *out = total;
    return 0;
}
