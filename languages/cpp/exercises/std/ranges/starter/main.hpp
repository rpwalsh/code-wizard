// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <string>
#include <vector>

struct Order {
    std::string customer;
    int total_cents = 0;
    bool paid = false;
};

/** The totals of the paid orders, in the order they arrived. */
std::vector<int> paid_totals(const std::vector<Order> &orders);

/** Every paid order added up. */
int paid_revenue(const std::vector<Order> &orders);

/** The totals of the paid orders, largest first, at most `limit` of them. */
std::vector<int> top_paid_totals(const std::vector<Order> &orders, int limit);

/** Each customer with at least one paid order, once, in first-seen order. */
std::vector<std::string> paying_customers(const std::vector<Order> &orders);

/** The customer of the first unpaid order, or an empty string. */
std::string first_unpaid_customer(const std::vector<Order> &orders);
