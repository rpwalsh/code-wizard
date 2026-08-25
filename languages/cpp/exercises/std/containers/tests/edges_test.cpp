// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <map>
#include <set>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(several_empty_skus_in_a_row_are_all_dropped, "cpp.std.containers") {
    // The case that catches erasing an iterator and then advancing it. One
    // erase in isolation often appears to work; consecutive ones do not.
    std::map<std::string, int> stock{
        {"a", 0}, {"b", 0}, {"c", 0}, {"d", 4}, {"e", 0}, {"f", 0}};
    drop_empty(stock);

    RETRAINER_ASSERT_INT((int)stock.size(), 1);
    RETRAINER_ASSERT(stock.count("d") == 1, "the one with stock survives");
}

RETRAINER_TEST(dropping_from_a_map_of_only_empties_leaves_nothing, "cpp.std.containers") {
    std::map<std::string, int> stock{{"a", 0}, {"b", 0}};
    drop_empty(stock);
    RETRAINER_ASSERT_INT((int)stock.size(), 0);
}

RETRAINER_TEST(dropping_from_an_empty_map_is_fine, "cpp.std.containers") {
    std::map<std::string, int> stock;
    drop_empty(stock);
    RETRAINER_ASSERT_INT((int)stock.size(), 0);
}

RETRAINER_TEST(a_negative_count_is_empty_too, "cpp.std.containers") {
    // Zero or below. A stock count that has gone negative is worse than
    // absent, not better, so it is certainly not something to keep.
    std::map<std::string, int> stock{{"a", -3}, {"b", 1}};
    drop_empty(stock);
    RETRAINER_ASSERT_INT((int)stock.size(), 1);
    RETRAINER_ASSERT(stock.count("b") == 1, "the positive one stays");
}

RETRAINER_TEST(distinct_of_nothing_is_nothing, "cpp.std.containers") {
    RETRAINER_ASSERT_INT((int)distinct({}).size(), 0);
}

RETRAINER_TEST(sets_with_nothing_in_common_overlap_in_nothing, "cpp.std.containers") {
    const std::set<std::string> left{"a", "b"};
    const std::set<std::string> right{"y", "z"};
    RETRAINER_ASSERT_INT((int)in_both(left, right).size(), 0);
    RETRAINER_ASSERT_INT((int)only_in_left(left, right).size(), 2);
}

RETRAINER_TEST(an_empty_set_overlaps_with_nothing, "cpp.std.containers") {
    const std::set<std::string> left{"a", "b"};
    const std::set<std::string> none;
    RETRAINER_ASSERT_INT((int)in_both(left, none).size(), 0);
    RETRAINER_ASSERT_INT((int)in_both(none, left).size(), 0);
    RETRAINER_ASSERT_INT((int)only_in_left(none, left).size(), 0);
    RETRAINER_ASSERT_INT((int)only_in_left(left, none).size(), 2);
}

RETRAINER_TEST(a_transfer_to_itself_is_refused, "cpp.std.containers") {
    // Allowed, it would subtract and add to the same entry and report
    // success. Harmless here and not harmless once the two steps can fail
    // independently.
    std::map<std::string, int> stock{{"bolt", 5}};
    RETRAINER_ASSERT(!transfer(stock, "bolt", "bolt", 2), "a move to nowhere is not a move");
    RETRAINER_ASSERT_INT(stock["bolt"], 5);
}

RETRAINER_TEST(a_transfer_of_nothing_is_refused, "cpp.std.containers") {
    std::map<std::string, int> stock{{"bolt", 5}};
    RETRAINER_ASSERT(!transfer(stock, "bolt", "nut", 0), "zero units is not a transfer");
    RETRAINER_ASSERT(!transfer(stock, "bolt", "nut", -2), "and neither is a negative one");
    RETRAINER_ASSERT_INT((int)stock.size(), 1);
}

RETRAINER_TEST(a_refused_transfer_does_not_create_the_destination, "cpp.std.containers") {
    // The reason to check everything before changing anything. Reaching for
    // stock[to] first inserts a zero-count sku that nobody asked for and
    // nothing removes.
    std::map<std::string, int> stock{{"bolt", 1}};
    RETRAINER_ASSERT(!transfer(stock, "bolt", "nut", 9), "not enough bolts");
    RETRAINER_ASSERT(stock.count("nut") == 0, "and so no nut entry either");

    RETRAINER_ASSERT(!transfer(stock, "missing", "nut", 1), "no such source");
    RETRAINER_ASSERT_INT((int)stock.size(), 1);
}

RETRAINER_TEST(a_transfer_of_everything_leaves_the_source_at_zero, "cpp.std.containers") {
    std::map<std::string, int> stock{{"bolt", 4}};
    RETRAINER_ASSERT(transfer(stock, "bolt", "nut", 4), "exactly enough is enough");
    RETRAINER_ASSERT_INT(stock["bolt"], 0);
    RETRAINER_ASSERT_INT(stock["nut"], 4);
}
