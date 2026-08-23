// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdio.h>

#include "retrainer.h"
#include "main.h"

static void write_file(const char *path, const char *contents) {
    FILE *file = fopen(path, "w");
    fputs(contents, file);
    fclose(file);
}

RETRAINER_TEST(a_final_line_without_newline_counts, "c.io.files") {
    write_file("no-trailing.txt", "one\ntwo");
    int lines = 0;
    count_lines("no-trailing.txt", &lines);
    RETRAINER_ASSERT_INT(lines, 2);
}

RETRAINER_TEST(an_empty_file_has_no_lines, "c.io.files") {
    write_file("empty.txt", "");
    int lines = 99;
    RETRAINER_ASSERT_INT(count_lines("empty.txt", &lines), 0);
    RETRAINER_ASSERT_INT(lines, 0);
}

RETRAINER_TEST(truncation_reports_the_true_length, "c.io.buffers") {
    write_file("long.txt", "abcdefghij\n");
    char tiny[5];
    int length = longest_line("long.txt", tiny, sizeof tiny);
    /* The buffer holds what fits; the return value tells the truth. */
    RETRAINER_ASSERT_INT(length, 10);
    RETRAINER_ASSERT_STR(tiny, "abcd");
}

RETRAINER_TEST(garbage_in_the_numbers_is_minus_two, "c.errors.returns") {
    write_file("bad.txt", "10\ntwelve\n30\n");
    long total = 123;
    RETRAINER_ASSERT_INT(sum_numbers("bad.txt", &total), -2);
    RETRAINER_ASSERT_INT((int)total, 123);
}

RETRAINER_TEST(a_partial_number_is_garbage_too, "c.errors.returns") {
    /* atoi would read 12 and march on; strtol's end pointer says no. */
    write_file("partial.txt", "12abc\n");
    long total = 0;
    RETRAINER_ASSERT_INT(sum_numbers("partial.txt", &total), -2);
}

RETRAINER_TEST(an_empty_numbers_file_sums_to_zero, "c.errors.returns") {
    write_file("none.txt", "");
    long total = 99;
    RETRAINER_ASSERT_INT(sum_numbers("none.txt", &total), 0);
    RETRAINER_ASSERT_INT((int)total, 0);
}
