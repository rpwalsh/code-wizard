// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <map>
#include <set>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(empty_skus_are_dropped, "cpp.std.containers") {
    std::map<std::string, int> stock{{"bolt", 3}, {"nut", 0}, {"washer", 5}};
    drop_empty(stock);

    RETRAINER_ASSERT_INT((int)stock.size(), 2);
    RETRAINER_ASSERT(stock.count("nut") == 0, "the empty one is gone");
    RETRAINER_ASSERT(stock.count("bolt") == 1, "the stocked ones stay");
}

RETRAINER_TEST(distinct_words_come_back_sorted_and_deduplicated, "cpp.std.containers") {
    const std::vector<std::string> words{"pear", "apple", "pear", "fig", "apple"};
    const std::set<std::string> unique = distinct(words);

    RETRAINER_ASSERT_INT((int)unique.size(), 3);
    RETRAINER_ASSERT(unique.count("pear") == 1, "pear appears once");
    RETRAINER_ASSERT(*unique.begin() == "apple", "and the first is the smallest");
}

RETRAINER_TEST(the_overlap_of_two_sets_is_found, "cpp.std.containers") {
    const std::set<std::string> left{"a", "b", "c"};
    const std::set<std::string> right{"b", "c", "d"};
    const std::vector<std::string> both = in_both(left, right);

    RETRAINER_ASSERT_INT((int)both.size(), 2);
    if (both.size() < 2) return;
    RETRAINER_ASSERT_STR(both[0], "b");
    RETRAINER_ASSERT_STR(both[1], "c");
}

RETRAINER_TEST(what_is_missing_from_the_other_set_is_found, "cpp.std.containers") {
    const std::set<std::string> left{"a", "b", "c"};
    const std::set<std::string> right{"b", "c", "d"};
    const std::vector<std::string> missing = only_in_left(left, right);

    RETRAINER_ASSERT_INT((int)missing.size(), 1);
    if (missing.empty()) return;
    RETRAINER_ASSERT_STR(missing[0], "a");
}

RETRAINER_TEST(a_transfer_moves_units_across, "cpp.std.containers") {
    std::map<std::string, int> stock{{"bolt", 10}, {"nut", 2}};
    RETRAINER_ASSERT(transfer(stock, "bolt", "nut", 4), "there are enough bolts");
    RETRAINER_ASSERT_INT(stock["bolt"], 6);
    RETRAINER_ASSERT_INT(stock["nut"], 6);
}

RETRAINER_TEST(a_transfer_can_create_the_destination, "cpp.std.containers") {
    std::map<std::string, int> stock{{"bolt", 10}};
    RETRAINER_ASSERT(transfer(stock, "bolt", "spare", 3), "the destination is new");
    RETRAINER_ASSERT_INT(stock["bolt"], 7);
    RETRAINER_ASSERT_INT(stock["spare"], 3);
}

RETRAINER_TEST(a_transfer_of_more_than_there_is_fails, "cpp.std.containers") {
    std::map<std::string, int> stock{{"bolt", 2}};
    RETRAINER_ASSERT(!transfer(stock, "bolt", "nut", 5), "two is not five");
    RETRAINER_ASSERT_INT(stock["bolt"], 2);
}
