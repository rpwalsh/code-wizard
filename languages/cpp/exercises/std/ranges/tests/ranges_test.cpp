// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
std::vector<Order> ledger() {
    return {
        {"acme", 1200, true},
        {"borton", 300, false},
        {"acme", 4500, true},
        {"crane", 900, true},
        {"borton", 50, true},
    };
}
}  // namespace

RETRAINER_TEST(the_paid_totals_come_out_in_arrival_order, "cpp.std.ranges") {
    const std::vector<int> totals = paid_totals(ledger());
    RETRAINER_ASSERT_INT((int)totals.size(), 4);
    if (totals.size() < 4) return;
    RETRAINER_ASSERT_INT(totals[0], 1200);
    RETRAINER_ASSERT_INT(totals[1], 4500);
    RETRAINER_ASSERT_INT(totals[3], 50);
}

RETRAINER_TEST(unpaid_orders_are_not_revenue, "cpp.std.ranges") {
    RETRAINER_ASSERT_INT(paid_revenue(ledger()), 1200 + 4500 + 900 + 50);
}

RETRAINER_TEST(the_largest_totals_come_first, "cpp.std.ranges") {
    const std::vector<int> top = top_paid_totals(ledger(), 2);
    RETRAINER_ASSERT_INT((int)top.size(), 2);
    if (top.size() < 2) return;
    RETRAINER_ASSERT_INT(top[0], 4500);
    RETRAINER_ASSERT_INT(top[1], 1200);
}

RETRAINER_TEST(asking_for_more_than_there_are_gives_all_of_them, "cpp.std.ranges") {
    const std::vector<int> top = top_paid_totals(ledger(), 100);
    RETRAINER_ASSERT_INT((int)top.size(), 4);
    if (top.empty()) return;
    RETRAINER_ASSERT_INT(top[0], 4500);
}

RETRAINER_TEST(each_paying_customer_appears_once, "cpp.std.ranges") {
    const std::vector<std::string> names = paying_customers(ledger());
    RETRAINER_ASSERT_INT((int)names.size(), 3);
    if (names.size() < 3) return;
    RETRAINER_ASSERT_STR(names[0], "acme");
    RETRAINER_ASSERT_STR(names[1], "crane");
    RETRAINER_ASSERT_STR(names[2], "borton");
}

RETRAINER_TEST(the_first_unpaid_customer_is_found, "cpp.std.ranges") {
    RETRAINER_ASSERT_STR(first_unpaid_customer(ledger()), "borton");
}
