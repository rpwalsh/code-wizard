// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <cstddef>
#include <ranges>
#include <set>

namespace {
/** The one predicate the pipelines below are built on. */
bool is_paid(const Order &order) {
    return order.paid;
}

int total_of(const Order &order) {
    return order.total_cents;
}
}  // namespace

std::vector<int> paid_totals(const std::vector<Order> &orders) {
    // A view does nothing until something reads from it. Nothing is copied,
    // nothing is allocated, and no intermediate vector of paid orders exists
    // between the filter and the transform.
    std::vector<int> totals;
    for (const int total : orders | std::views::filter(is_paid) |
                               std::views::transform(total_of)) {
        totals.push_back(total);
    }
    return totals;
}

int paid_revenue(const std::vector<Order> &orders) {
    int sum = 0;
    for (const int total : orders | std::views::filter(is_paid) |
                               std::views::transform(total_of)) {
        sum += total;
    }
    return sum;
}

std::vector<int> top_paid_totals(const std::vector<Order> &orders, int limit) {
    if (limit <= 0) {
        return {};
    }

    // Sorting needs somewhere to put things. A view is a way of looking at a
    // range, and rearranging what you are looking at is not something it can
    // do lazily, so this one is materialized first.
    std::vector<int> totals = paid_totals(orders);
    std::ranges::sort(totals, std::ranges::greater{});

    const std::size_t keep = std::min(totals.size(), static_cast<std::size_t>(limit));
    return std::vector<int>(totals.begin(), totals.begin() + static_cast<long>(keep));
}

std::vector<std::string> paying_customers(const std::vector<Order> &orders) {
    std::vector<std::string> names;
    std::set<std::string> seen;
    for (const Order &order : orders | std::views::filter(is_paid)) {
        // First-seen order, so a set records what has been emitted rather
        // than holding the answer. A set of names would come back sorted.
        if (seen.insert(order.customer).second) {
            names.push_back(order.customer);
        }
    }
    return names;
}

std::string first_unpaid_customer(const std::vector<Order> &orders) {
    const auto found = std::ranges::find_if(
        orders, [](const Order &order) { return !order.paid; });
    if (found == orders.end()) {
        return "";
    }
    return found->customer;
}
