// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_H
#define MAIN_H

#include <stddef.h>

/** A growable array of int. `length` is how many; `capacity` is room for. */
typedef struct {
    int *items;
    size_t length;
    size_t capacity;
} Vector;

/** An empty vector that owns nothing. */
void vec_init(Vector *vector);

/** Append. 1 on success; 0 leaves the vector exactly as it was. */
int vec_push(Vector *vector, int value);

/** 1 and writes through `out` when in range; 0 otherwise. */
int vec_get(const Vector *vector, size_t index, int *out);

/** Remove the last item. 1 and writes through `out`; 0 when empty. */
int vec_pop(Vector *vector, int *out);

/** Release the buffer and leave the vector valid and empty. */
void vec_free(Vector *vector);

#endif /* MAIN_H */
