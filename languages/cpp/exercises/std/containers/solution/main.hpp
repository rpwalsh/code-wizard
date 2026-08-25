// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <map>
#include <set>
#include <string>
#include <vector>

/** Remove every sku whose count is zero or below. */
void drop_empty(std::map<std::string, int> &stock);

/** Every distinct word, which a set gives you sorted and deduplicated. */
std::set<std::string> distinct(const std::vector<std::string> &words);

/** The skus in both sets, in order. */
std::vector<std::string> in_both(const std::set<std::string> &left,
                                 const std::set<std::string> &right);

/** The skus in the left set and not the right, in order. */
std::vector<std::string> only_in_left(const std::set<std::string> &left,
                                      const std::set<std::string> &right);

/**
 * Move `count` units from one sku to another.
 *
 * Returns whether it happened. A transfer that cannot happen changes nothing
 * at all: no partial moves, no sku created for a move that was refused.
 */
bool transfer(std::map<std::string, int> &stock, const std::string &from,
              const std::string &to, int count);
