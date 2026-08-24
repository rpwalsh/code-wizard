/* Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) */
#include "main.h"

#include <stdlib.h>
#include <string.h>

void list_init(StringList *list) {
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
}

char *duplicate(const char *text) {
    /* +1 for the terminator. Forgetting it is the single most common
       buffer overflow in C, and it writes exactly one byte past the end. */
    size_t length = strlen(text);
    char *copy = malloc(length + 1);
    if (copy == NULL) {
        return NULL;
    }
    memcpy(copy, text, length + 1);
    return copy;
}

int list_push(StringList *list, const char *text) {
    if (list->count == list->capacity) {
        size_t capacity = list->capacity == 0 ? 4 : list->capacity * 2;

        /* Assigned to a temporary first: realloc returns NULL on failure
           and does not free the old block, so assigning straight back to
           list->items would leak everything the list already held. */
        char **grown = realloc(list->items, capacity * sizeof(char *));
        if (grown == NULL) {
            return 0;
        }

        list->items = grown;
        list->capacity = capacity;
    }

    char *copy = duplicate(text);
    if (copy == NULL) {
        return 0;
    }

    list->items[list->count] = copy;
    list->count += 1;
    return 1;
}

void list_free(StringList *list) {
    for (size_t index = 0; index < list->count; index += 1) {
        free(list->items[index]);
    }
    free(list->items);

    /* Reset rather than leave dangling: a freed pointer that is still
       readable is the one somebody uses again. */
    list_init(list);
}

char *join(const StringList *list, char separator) {
    size_t total = 1;
    for (size_t index = 0; index < list->count; index += 1) {
        total += strlen(list->items[index]);
        if (index + 1 < list->count) {
            total += 1;
        }
    }

    char *out = malloc(total);
    if (out == NULL) {
        return NULL;
    }

    size_t at = 0;
    for (size_t index = 0; index < list->count; index += 1) {
        size_t length = strlen(list->items[index]);
        memcpy(out + at, list->items[index], length);
        at += length;
        if (index + 1 < list->count) {
            out[at] = separator;
            at += 1;
        }
    }

    out[at] = '\0';
    return out;
}
