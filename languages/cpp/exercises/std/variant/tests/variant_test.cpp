// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(each_kind_of_cell_renders_its_own_way, "cpp.std.variant") {
    RETRAINER_ASSERT_STR(render(Blank{}), "");
    RETRAINER_ASSERT_STR(render(Number{42}), "42");
    RETRAINER_ASSERT_STR(render(Text{"hello"}), "hello");
    RETRAINER_ASSERT_STR(render(Failure{"circular reference"}), "#ERR: circular reference");
}

RETRAINER_TEST(a_number_cell_gives_up_its_number, "cpp.std.variant") {
    const std::optional<int> value = as_number(Number{7});
    RETRAINER_ASSERT(value.has_value(), "a number has a number");
    if (!value.has_value()) return;
    RETRAINER_ASSERT_INT(value.value(), 7);
}

RETRAINER_TEST(a_blank_cell_counts_as_zero, "cpp.std.variant") {
    const std::optional<int> value = as_number(Blank{});
    RETRAINER_ASSERT(value.has_value(), "blank is a number, and it is zero");
    if (!value.has_value()) return;
    RETRAINER_ASSERT_INT(value.value(), 0);
}

RETRAINER_TEST(text_and_failures_are_not_numbers, "cpp.std.variant") {
    RETRAINER_ASSERT(!as_number(Text{"12"}).has_value(), "text that looks numeric is text");
    RETRAINER_ASSERT(!as_number(Failure{"broken"}).has_value(), "and a failure is not zero");
}

RETRAINER_TEST(the_total_adds_the_numbers_and_skips_the_text, "cpp.std.variant") {
    const std::vector<Cell> sheet{Number{10}, Text{"label"}, Number{5}, Blank{}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "15");
}

RETRAINER_TEST(a_failure_anywhere_makes_the_total_a_failure, "cpp.std.variant") {
    const std::vector<Cell> sheet{Number{10}, Failure{"divide by zero"}, Number{5}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "#ERR: divide by zero");
}

RETRAINER_TEST(the_kinds_are_counted, "cpp.std.variant") {
    const std::vector<Cell> sheet{Blank{},      Number{1}, Number{2},
                                  Text{"note"}, Blank{},   Failure{"bad"}};
    const Tally counts = tally(sheet);

    RETRAINER_ASSERT_INT(counts.blanks, 2);
    RETRAINER_ASSERT_INT(counts.numbers, 2);
    RETRAINER_ASSERT_INT(counts.texts, 1);
    RETRAINER_ASSERT_INT(counts.failures, 1);
}
