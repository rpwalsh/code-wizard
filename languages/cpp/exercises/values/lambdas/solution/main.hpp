// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <functional>
#include <vector>

/**
 * Hands out `start`, then `start + 1`, then `start + 2`, and so on.
 *
 * Each counter has its own number. Two of them do not share a count.
 */
std::function<int()> make_counter(int start);

/** A predicate that copies the threshold once, when it is made. */
std::function<bool(int)> above_snapshot(int threshold);

/** A predicate that reads the threshold every time it is called. */
std::function<bool(int)> above_live(const int &threshold);

/** The values for which `keep` says true, in order. */
std::vector<int> filter(const std::vector<int> &values,
                        const std::function<bool(int)> &keep);

/** Each action applied in turn to a running value. */
int apply_all(int start, const std::vector<std::function<int(int)>> &actions);
