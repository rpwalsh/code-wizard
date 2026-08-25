// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <optional>
#include <vector>

/**
 * Every function here takes a vector that is already sorted ascending, and
 * every one of them must stay logarithmic. A linear scan gets the right
 * answer and throws away the only reason the data was sorted.
 */

/** Whether the values contain `wanted`. */
bool contains(const std::vector<int> &sorted, int wanted);

/** The first index at which `wanted` could be inserted, keeping the order. */
int insertion_point(const std::vector<int> &sorted, int wanted);

/** How many times `wanted` appears. */
int count_of(const std::vector<int> &sorted, int wanted);

/** The first value at least as large as `wanted`, or nothing. */
std::optional<int> first_at_least(const std::vector<int> &sorted, int wanted);

/** Inserts `value`, keeping the order. Equal values go before their equals. */
void insert_sorted(std::vector<int> &sorted, int value);
