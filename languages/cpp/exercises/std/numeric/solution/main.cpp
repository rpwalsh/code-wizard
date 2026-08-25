// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <functional>
#include <numeric>

long long total(const std::vector<int> &values) {
    // The initial value decides the accumulator's type. Pass 0 and the whole
    // sum is computed in int, which overflows long before the long long
    // return type ever sees it — the widening happens too late to help.
    return std::accumulate(values.begin(), values.end(), 0LL);
}

std::vector<int> running_totals(const std::vector<int> &values) {
    std::vector<int> totals(values.size());
    std::partial_sum(values.begin(), values.end(), totals.begin());
    return totals;
}

std::vector<int> differences(const std::vector<int> &values) {
    std::vector<int> steps(values.size());
    // The first element is copied through rather than differenced, which is
    // what makes this the exact inverse of partial_sum.
    std::adjacent_difference(values.begin(), values.end(), steps.begin());
    return steps;
}

std::vector<int> sequence(int count) {
    if (count <= 0) {
        return {};
    }
    std::vector<int> values(static_cast<std::size_t>(count));
    std::iota(values.begin(), values.end(), 0);
    return values;
}

long long dot(const std::vector<int> &left, const std::vector<int> &right) {
    if (left.size() != right.size()) {
        throw std::invalid_argument("the two must be the same length");
    }
    // The seed widens the accumulator and nothing else. Each product is
    // still int times int, computed and overflowed before the addition ever
    // sees it — so the multiplication has to be widened separately.
    return std::inner_product(
        left.begin(), left.end(), right.begin(), 0LL, std::plus<long long>(),
        [](int one, int other) { return static_cast<long long>(one) * other; });
}
