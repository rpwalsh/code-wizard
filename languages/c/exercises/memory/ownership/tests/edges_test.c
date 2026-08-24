// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdlib.h>
#include <string.h>

#include "retrainer.h"
#include "main.h"

RETRAINER_TEST(the_list_owns_its_copy_not_the_callers_buffer, "c.memory.malloc") {
    /* The buffer is overwritten after the push. A list that stored the
       pointer rather than a copy now reads the new contents — or worse,
       reads a buffer that has gone out of scope entirely. */
    char buffer[16];
    strcpy(buffer, "original");

    StringList list;
    list_init(&list);
    list_push(&list, buffer);

    strcpy(buffer, "changed!");

    RETRAINER_ASSERT_STR(list.items[0], "original");
    list_free(&list);
}

RETRAINER_TEST(duplicate_terminates_its_copy, "c.memory.malloc") {
    /* strlen on the copy is the check: without the +1 for the terminator
       the length is whatever happened to follow in memory. */
    char *copy = duplicate("abc");
    RETRAINER_ASSERT_INT((int)strlen(copy), 3);
    RETRAINER_ASSERT(copy[3] == '\0', "the copy is terminated");
    free(copy);
}

RETRAINER_TEST(duplicating_an_empty_string_gives_an_empty_string, "c.memory.malloc") {
    char *copy = duplicate("");
    RETRAINER_ASSERT_INT((int)strlen(copy), 0);
    RETRAINER_ASSERT(copy[0] == '\0', "an empty copy is still terminated");
    free(copy);
}

RETRAINER_TEST(joining_nothing_gives_an_empty_string, "c.memory.malloc") {
    StringList list;
    list_init(&list);

    char *joined = join(&list, ',');
    RETRAINER_ASSERT(joined != NULL, "join always returns an allocation");
    RETRAINER_ASSERT_INT((int)strlen(joined), 0);

    free(joined);
    list_free(&list);
}

RETRAINER_TEST(joining_one_item_adds_no_separator, "c.memory.malloc") {
    StringList list;
    list_init(&list);
    list_push(&list, "solo");

    char *joined = join(&list, '-');
    RETRAINER_ASSERT_STR(joined, "solo");

    free(joined);
    list_free(&list);
}

RETRAINER_TEST(joining_handles_empty_items, "c.memory.malloc") {
    StringList list;
    list_init(&list);
    list_push(&list, "");
    list_push(&list, "b");
    list_push(&list, "");

    char *joined = join(&list, '|');
    RETRAINER_ASSERT_STR(joined, "|b|");

    free(joined);
    list_free(&list);
}

RETRAINER_TEST(each_stored_string_is_its_own_allocation, "c.memory.malloc") {
    StringList list;
    list_init(&list);
    list_push(&list, "same");
    list_push(&list, "same");

    /* Equal contents, separate allocations: freeing the list must not free
       one block twice, which is undefined behavior rather than an error. */
    RETRAINER_ASSERT(list.items[0] != list.items[1], "two pushes, two blocks");
    RETRAINER_ASSERT_STR(list.items[0], "same");

    list_free(&list);
}

RETRAINER_TEST(freeing_an_empty_list_is_safe, "c.memory.malloc") {
    StringList list;
    list_init(&list);
    list_free(&list);
    /* free(NULL) is defined and does nothing, which is why the loop and
       the final free need no guard. */
    list_free(&list);
    RETRAINER_ASSERT_INT((int)list.count, 0);
}
