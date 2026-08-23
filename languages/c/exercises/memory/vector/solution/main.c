// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.h"

#include <stdlib.h>

#define VEC_FIRST_CAPACITY 4

void vec_init(Vector *vector) {
    /* No allocation: a vector nobody pushes to should not call malloc. */
    vector->items = NULL;
    vector->length = 0;
    vector->capacity = 0;
}

/** Make room for one more. 1 on success; 0 leaves the vector untouched. */
static int vec_grow(Vector *vector) {
    if (vector->length < vector->capacity) {
        return 1;
    }

    size_t bigger = vector->capacity == 0 ? VEC_FIRST_CAPACITY : vector->capacity * 2;

    /*
     * Into a temporary, never straight back into vector->items.
     * A failed realloc returns NULL and leaves the old block allocated, so
     * assigning it directly would leak the block and lose the data at once.
     */
    int *grown = realloc(vector->items, bigger * sizeof *grown);
    if (grown == NULL) {
        return 0;
    }

    vector->items = grown;
    vector->capacity = bigger;
    return 1;
}

int vec_push(Vector *vector, int value) {
    if (!vec_grow(vector)) {
        return 0;
    }

    vector->items[vector->length] = value;
    vector->length += 1;
    return 1;
}

int vec_get(const Vector *vector, size_t index, int *out) {
    if (index >= vector->length) {
        return 0;
    }

    *out = vector->items[index];
    return 1;
}

int vec_pop(Vector *vector, int *out) {
    if (vector->length == 0) {
        return 0;
    }

    vector->length -= 1;
    *out = vector->items[vector->length];
    /* The capacity stays: shrinking here turns push/pop into an allocator loop. */
    return 1;
}

void vec_free(Vector *vector) {
    free(vector->items);

    /* Leaving this valid and empty is what makes a second call safe. */
    vector->items = NULL;
    vector->length = 0;
    vector->capacity = 0;
}
