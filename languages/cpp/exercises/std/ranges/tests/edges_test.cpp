// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_ledger_yields_nothing, "cpp.std.ranges") {
    const std::vector<Order> none;
    RETRAINER_ASSERT_INT((int)paid_totals(none).size(), 0);
    RETRAINER_ASSERT_INT(paid_revenue(none), 0);
    RETRAINER_ASSERT_INT((int)top_paid_totals(none, 5).size(), 0);
    RETRAINER_ASSERT_INT((int)paying_customers(none).size(), 0);
    RETRAINER_ASSERT_STR(first_unpaid_customer(none), "");
}

RETRAINER_TEST(a_ledger_of_unpaid_orders_earns_nothing, "cpp.std.ranges") {
    const std::vector<Order> orders{{"a", 100, false}, {"b", 200, false}};
    RETRAINER_ASSERT_INT(paid_revenue(orders), 0);
    RETRAINER_ASSERT_INT((int)paid_totals(orders).size(), 0);
    RETRAINER_ASSERT_INT((int)paying_customers(orders).size(), 0);
    RETRAINER_ASSERT_STR(first_unpaid_customer(orders), "a");
}

RETRAINER_TEST(everything_paid_means_no_first_unpaid, "cpp.std.ranges") {
    const std::vector<Order> orders{{"a", 100, true}, {"b", 200, true}};
    RETRAINER_ASSERT_STR(first_unpaid_customer(orders), "");
}

RETRAINER_TEST(a_limit_of_zero_or_below_gives_nothing, "cpp.std.ranges") {
    const std::vector<Order> orders{{"a", 100, true}, {"b", 200, true}};
    RETRAINER_ASSERT_INT((int)top_paid_totals(orders, 0).size(), 0);
    RETRAINER_ASSERT_INT((int)top_paid_totals(orders, -3).size(), 0);
}

RETRAINER_TEST(equal_totals_are_both_kept, "cpp.std.ranges") {
    // Sorting is not deduplicating. Two orders of the same size are two
    // orders, and a report that collapses them undercounts the day.
    const std::vector<Order> orders{{"a", 500, true}, {"b", 500, true}};
    const std::vector<int> top = top_paid_totals(orders, 5);
    RETRAINER_ASSERT_INT((int)top.size(), 2);
    if (top.size() < 2) return;
    RETRAINER_ASSERT_INT(top[0], 500);
    RETRAINER_ASSERT_INT(top[1], 500);
}

RETRAINER_TEST(the_same_customer_paying_twice_is_still_one_customer, "cpp.std.ranges") {
    const std::vector<Order> orders{
        {"acme", 1, true}, {"acme", 2, true}, {"acme", 3, true}};
    const std::vector<std::string> names = paying_customers(orders);
    RETRAINER_ASSERT_INT((int)names.size(), 1);
    if (names.empty()) return;
    RETRAINER_ASSERT_STR(names[0], "acme");
}

RETRAINER_TEST(an_unpaid_order_does_not_make_a_paying_customer, "cpp.std.ranges") {
    // The customer appears twice, once unpaid and once paid. Filtering after
    // collecting the names instead of before would let the unpaid one in.
    const std::vector<Order> orders{{"acme", 100, false}, {"borton", 200, true}};
    const std::vector<std::string> names = paying_customers(orders);
    RETRAINER_ASSERT_INT((int)names.size(), 1);
    if (names.empty()) return;
    RETRAINER_ASSERT_STR(names[0], "borton");
}

RETRAINER_TEST(customers_keep_first_seen_order_not_alphabetical, "cpp.std.ranges") {
    // A set of names would answer sorted, which is a different question.
    const std::vector<Order> orders{
        {"zulu", 1, true}, {"alpha", 2, true}, {"mike", 3, true}};
    const std::vector<std::string> names = paying_customers(orders);
    RETRAINER_ASSERT_INT((int)names.size(), 3);
    if (names.size() < 3) return;
    RETRAINER_ASSERT_STR(names[0], "zulu");
    RETRAINER_ASSERT_STR(names[1], "alpha");
    RETRAINER_ASSERT_STR(names[2], "mike");
}

RETRAINER_TEST(an_order_of_zero_is_still_an_order, "cpp.std.ranges") {
    const std::vector<Order> orders{{"acme", 0, true}};
    RETRAINER_ASSERT_INT((int)paid_totals(orders).size(), 1);
    RETRAINER_ASSERT_INT(paid_revenue(orders), 0);
    RETRAINER_ASSERT_INT((int)paying_customers(orders).size(), 1);
}

RETRAINER_TEST(a_refund_is_a_negative_total, "cpp.std.ranges") {
    const std::vector<Order> orders{{"a", 1000, true}, {"b", -250, true}};
    RETRAINER_ASSERT_INT(paid_revenue(orders), 750);

    const std::vector<int> top = top_paid_totals(orders, 5);
    RETRAINER_ASSERT_INT((int)top.size(), 2);
    if (top.size() < 2) return;
    RETRAINER_ASSERT_INT(top[0], 1000);
    RETRAINER_ASSERT_INT(top[1], -250);
}

RETRAINER_TEST(taking_one_takes_the_largest, "cpp.std.ranges") {
    const std::vector<Order> orders{
        {"a", 10, true}, {"b", 900, true}, {"c", 50, true}};
    const std::vector<int> top = top_paid_totals(orders, 1);
    RETRAINER_ASSERT_INT((int)top.size(), 1);
    if (top.empty()) return;
    RETRAINER_ASSERT_INT(top[0], 900);
}
