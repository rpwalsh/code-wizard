// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_sheet_totals_zero, "cpp.std.variant") {
    RETRAINER_ASSERT_STR(render(total({})), "0");
}

RETRAINER_TEST(a_sheet_of_blanks_totals_zero, "cpp.std.variant") {
    const std::vector<Cell> sheet{Blank{}, Blank{}, Blank{}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "0");
}

RETRAINER_TEST(a_sheet_of_text_totals_zero, "cpp.std.variant") {
    // Skipped, not refused. A spreadsheet column of labels sums to nothing
    // rather than to an error, which is the behavior people expect.
    const std::vector<Cell> sheet{Text{"a"}, Text{"b"}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "0");
}

RETRAINER_TEST(the_first_failure_is_the_one_reported, "cpp.std.variant") {
    // Reporting the last would mean the answer depends on how far the loop
    // got before somebody added a cell below.
    const std::vector<Cell> sheet{Number{1}, Failure{"first"}, Failure{"second"}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "#ERR: first");
}

RETRAINER_TEST(a_failure_at_the_very_end_still_wins, "cpp.std.variant") {
    const std::vector<Cell> sheet{Number{1}, Number{2}, Failure{"last"}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "#ERR: last");
}

RETRAINER_TEST(negative_numbers_add_up_too, "cpp.std.variant") {
    const std::vector<Cell> sheet{Number{10}, Number{-4}, Number{-6}};
    RETRAINER_ASSERT_STR(render(total(sheet)), "0");
}

RETRAINER_TEST(a_blank_reason_still_renders_as_an_error, "cpp.std.variant") {
    RETRAINER_ASSERT_STR(render(Failure{""}), "#ERR: ");
}

RETRAINER_TEST(empty_text_is_text_and_not_blank, "cpp.std.variant") {
    // Both render as nothing and they are not the same cell. A cell somebody
    // typed an empty string into is filled in; a blank one is not.
    const Cell empty_text = Text{""};
    const Cell blank = Blank{};
    RETRAINER_ASSERT_STR(render(empty_text), "");
    RETRAINER_ASSERT_STR(render(blank), "");

    RETRAINER_ASSERT(!as_number(empty_text).has_value(), "empty text is not a number");
    RETRAINER_ASSERT(as_number(blank).has_value(), "a blank is");

    const Tally counts = tally({empty_text, blank});
    RETRAINER_ASSERT_INT(counts.texts, 1);
    RETRAINER_ASSERT_INT(counts.blanks, 1);
}

RETRAINER_TEST(counting_nothing_counts_nothing, "cpp.std.variant") {
    const Tally counts = tally({});
    RETRAINER_ASSERT_INT(counts.blanks, 0);
    RETRAINER_ASSERT_INT(counts.numbers, 0);
    RETRAINER_ASSERT_INT(counts.texts, 0);
    RETRAINER_ASSERT_INT(counts.failures, 0);
}

RETRAINER_TEST(a_number_of_zero_is_a_number, "cpp.std.variant") {
    RETRAINER_ASSERT_STR(render(Number{0}), "0");
    const Tally counts = tally({Number{0}});
    RETRAINER_ASSERT_INT(counts.numbers, 1);
    RETRAINER_ASSERT_INT(counts.blanks, 0);
}

RETRAINER_TEST(a_negative_number_renders_with_its_sign, "cpp.std.variant") {
    RETRAINER_ASSERT_STR(render(Number{-15}), "-15");
}

RETRAINER_TEST(a_cell_holds_exactly_one_kind_at_a_time, "cpp.std.variant") {
    // Reassigning changes which alternative is held, and the old one is
    // destroyed. There is no moment where it is both.
    Cell cell = Number{5};
    RETRAINER_ASSERT(std::holds_alternative<Number>(cell), "a number to begin with");

    cell = Text{"now text"};
    RETRAINER_ASSERT(std::holds_alternative<Text>(cell), "text afterwards");
    RETRAINER_ASSERT(!std::holds_alternative<Number>(cell), "and not still a number");
    RETRAINER_ASSERT_STR(render(cell), "now text");
}
