// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <stdexcept>
#include <vector>

/** Every value added together. */
long long total(const std::vector<int> &values);

/** The running totals: {1, 2, 3} becomes {1, 3, 6}. */
std::vector<int> running_totals(const std::vector<int> &values);

/** The step between neighbors: {1, 3, 6} becomes {1, 2, 3}. */
std::vector<int> differences(const std::vector<int> &values);

/** 0, 1, 2, up to count - 1. A count of zero or below gives nothing. */
std::vector<int> sequence(int count);

/** The sum of the products, pairwise. Different lengths throw. */
long long dot(const std::vector<int> &left, const std::vector<int> &right);
