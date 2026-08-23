// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(reading_out_of_range_writes_nothing, "c.errors.cleanup") {
    Vector vector;
    vec_init(&vector);
    vec_push(&vector, 7);

    int value = -1;
    RETRAINER_ASSERT_INT(vec_get(&vector, 1, &value), 0);
    RETRAINER_ASSERT_INT(value, -1);

    RETRAINER_ASSERT_INT(vec_get(&vector, 99, &value), 0);
    RETRAINER_ASSERT_INT(value, -1);

    vec_free(&vector);
}

RETRAINER_TEST(popping_an_empty_vector_reports_it, "c.errors.cleanup") {
    Vector vector;
    vec_init(&vector);

    int value = -1;
    RETRAINER_ASSERT_INT(vec_pop(&vector, &value), 0);
    RETRAINER_ASSERT_INT(value, -1);

    vec_free(&vector);
}

RETRAINER_TEST(popping_keeps_the_capacity, "c.memory.lifetime") {
    Vector vector;
    vec_init(&vector);
    for (int index = 0; index < 20; index += 1) {
        vec_push(&vector, index);
    }

    size_t grown = vector.capacity;
    int value = 0;
    for (int index = 0; index < 20; index += 1) {
        vec_pop(&vector, &value);
    }

    RETRAINER_ASSERT_INT((int)vector.length, 0);
    RETRAINER_ASSERT(vector.capacity == grown, "popping should not shrink the buffer");

    vec_free(&vector);
}

RETRAINER_TEST(freeing_twice_is_safe, "c.errors.cleanup") {
    Vector vector;
    vec_init(&vector);
    vec_push(&vector, 1);

    vec_free(&vector);
    RETRAINER_ASSERT(vector.items == NULL, "vec_free should clear the pointer");
    RETRAINER_ASSERT_INT((int)vector.length, 0);
    RETRAINER_ASSERT_INT((int)vector.capacity, 0);

    /* The second call must be a no-op, not a double free. */
    vec_free(&vector);
    RETRAINER_ASSERT(vector.items == NULL, "still nothing to own");
}

RETRAINER_TEST(a_freed_vector_can_be_used_again, "c.memory.lifetime") {
    Vector vector;
    vec_init(&vector);
    vec_push(&vector, 1);
    vec_free(&vector);

    RETRAINER_ASSERT_INT(vec_push(&vector, 42), 1);

    int value = 0;
    RETRAINER_ASSERT_INT(vec_get(&vector, 0, &value), 1);
    RETRAINER_ASSERT_INT(value, 42);
    RETRAINER_ASSERT_INT((int)vector.length, 1);

    vec_free(&vector);
}
