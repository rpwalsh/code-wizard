/* Copyright 2026 Ryan P. Walsh (rpwalsh.github.io) */
#ifndef RETRAINER_MAIN_H
#define RETRAINER_MAIN_H

#include <stddef.h>

/* A growable array of owned strings. */
typedef struct {
    char **items;
    size_t count;
    size_t capacity;
} StringList;

void list_init(StringList *list);
int list_push(StringList *list, const char *text);
void list_free(StringList *list);

char *duplicate(const char *text);
char *join(const StringList *list, char separator);

#endif
