// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdio.h>

#include "retrainer.h"
#include "main.h"

static void write_file(const char *path, const char *contents) {
    FILE *file = fopen(path, "w");
    fputs(contents, file);
    fclose(file);
}

RETRAINER_TEST(counts_newline_terminated_lines, "c.io.files") {
    write_file("three.txt", "one\ntwo\nthree\n");
    int lines = 0;
    RETRAINER_ASSERT_INT(count_lines("three.txt", &lines), 0);
    RETRAINER_ASSERT_INT(lines, 3);
}

RETRAINER_TEST(a_missing_file_reports_minus_one, "c.errors.returns") {
    int lines = 99;
    RETRAINER_ASSERT_INT(count_lines("no-such-file.txt", &lines), -1);
    RETRAINER_ASSERT_INT(lines, 99);
}

RETRAINER_TEST(finds_the_longest_line, "c.io.buffers") {
    write_file("mixed.txt", "hi\na much longer line\nmid\n");
    char buffer[64];
    int length = longest_line("mixed.txt", buffer, sizeof buffer);
    RETRAINER_ASSERT_INT(length, 18);
    RETRAINER_ASSERT_STR(buffer, "a much longer line");
}

RETRAINER_TEST(sums_a_file_of_numbers, "c.io.files") {
    write_file("numbers.txt", "10\n-3\n40\n");
    long total = 0;
    RETRAINER_ASSERT_INT(sum_numbers("numbers.txt", &total), 0);
    RETRAINER_ASSERT_INT((int)total, 47);
}
