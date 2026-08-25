// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <stdexcept>
#include <string>
#include <tuple>
#include <utility>
#include <vector>

/** The smallest and the largest, in that order. An empty list throws. */
std::pair<int, int> range_of(const std::vector<int> &values);

/** "ada/3/95" becomes the name, the level and the score. Anything else throws. */
std::tuple<std::string, int, int> parse_entry(const std::string &text);

/** The total, how many there were, and the average rounded toward zero. */
std::tuple<int, int, int> summarize(const std::vector<int> &values);

/** Entries by score, highest first. Equal scores are ordered by name. */
std::vector<std::pair<std::string, int>> by_score(
    std::vector<std::pair<std::string, int>> entries);
