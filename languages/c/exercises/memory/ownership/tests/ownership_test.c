// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdlib.h>
#include <string.h>

#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(a_new_list_is_empty, "c.memory.malloc") {
    StringList list;
    list_init(&list);

    RETRAINER_ASSERT_INT((int)list.count, 0);
    RETRAINER_ASSERT(list.items == NULL, "a new list owns nothing yet");

    list_free(&list);
}

RETRAINER_TEST(pushing_stores_the_text, "c.memory.malloc") {
    StringList list;
    list_init(&list);

    RETRAINER_ASSERT_INT(list_push(&list, "alpha"), 1);
    RETRAINER_ASSERT_INT(list_push(&list, "beta"), 1);

    RETRAINER_ASSERT_INT((int)list.count, 2);
    RETRAINER_ASSERT_STR(list.items[0], "alpha");
    RETRAINER_ASSERT_STR(list.items[1], "beta");

    list_free(&list);
}

RETRAINER_TEST(duplicate_copies_the_bytes, "c.memory.malloc") {
    char *copy = duplicate("hello");
    RETRAINER_ASSERT_STR(copy, "hello");
    free(copy);
}

RETRAINER_TEST(joining_puts_the_separator_between, "c.memory.malloc") {
    StringList list;
    list_init(&list);
    list_push(&list, "a");
    list_push(&list, "b");
    list_push(&list, "c");

    char *joined = join(&list, ',');
    RETRAINER_ASSERT_STR(joined, "a,b,c");

    free(joined);
    list_free(&list);
}

RETRAINER_TEST(a_list_grows_past_its_first_capacity, "c.memory.malloc") {
    StringList list;
    list_init(&list);

    for (int index = 0; index < 20; index += 1) {
        RETRAINER_ASSERT_INT(list_push(&list, "x"), 1);
    }

    RETRAINER_ASSERT_INT((int)list.count, 20);
    RETRAINER_ASSERT_STR(list.items[19], "x");

    list_free(&list);
}

RETRAINER_TEST(freeing_leaves_the_list_reusable, "c.memory.malloc") {
    StringList list;
    list_init(&list);
    list_push(&list, "one");
    list_free(&list);

    RETRAINER_ASSERT_INT((int)list.count, 0);
    RETRAINER_ASSERT(list.items == NULL, "a freed list holds no pointer");

    /* Reusable rather than merely emptied: the list is init'd again. */
    RETRAINER_ASSERT_INT(list_push(&list, "two"), 1);
    RETRAINER_ASSERT_STR(list.items[0], "two");
    list_free(&list);
}
