// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(starts_empty_and_owns_nothing, "c.memory.malloc") {
    Vector vector;
    vec_init(&vector);

    RETRAINER_ASSERT_INT((int)vector.length, 0);
    RETRAINER_ASSERT_INT((int)vector.capacity, 0);
    RETRAINER_ASSERT(vector.items == NULL, "an untouched vector should own no buffer");

    vec_free(&vector);
}

RETRAINER_TEST(pushes_and_reads_back, "c.memory.malloc") {
    Vector vector;
    vec_init(&vector);

    RETRAINER_ASSERT_INT(vec_push(&vector, 10), 1);
    RETRAINER_ASSERT_INT(vec_push(&vector, 20), 1);
    RETRAINER_ASSERT_INT((int)vector.length, 2);

    int value = 0;
    RETRAINER_ASSERT_INT(vec_get(&vector, 0, &value), 1);
    RETRAINER_ASSERT_INT(value, 10);
    RETRAINER_ASSERT_INT(vec_get(&vector, 1, &value), 1);
    RETRAINER_ASSERT_INT(value, 20);

    vec_free(&vector);
}

RETRAINER_TEST(grows_past_the_first_capacity, "c.memory.malloc") {
    Vector vector;
    vec_init(&vector);

    for (int index = 0; index < 100; index += 1) {
        RETRAINER_ASSERT_INT(vec_push(&vector, index * 3), 1);
    }

    RETRAINER_ASSERT_INT((int)vector.length, 100);
    RETRAINER_ASSERT(vector.capacity >= 100, "capacity should have grown to fit");

    int value = 0;
    RETRAINER_ASSERT_INT(vec_get(&vector, 99, &value), 1);
    RETRAINER_ASSERT_INT(value, 297);

    vec_free(&vector);
}

RETRAINER_TEST(pops_from_the_end, "c.memory.lifetime") {
    Vector vector;
    vec_init(&vector);
    vec_push(&vector, 1);
    vec_push(&vector, 2);

    int value = 0;
    RETRAINER_ASSERT_INT(vec_pop(&vector, &value), 1);
    RETRAINER_ASSERT_INT(value, 2);
    RETRAINER_ASSERT_INT((int)vector.length, 1);

    vec_free(&vector);
}
