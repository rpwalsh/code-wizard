// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <iterator>

void drop_empty(std::map<std::string, int> &stock) {
    std::map<std::string, int>::iterator entry = stock.begin();
    while (entry != stock.end()) {
        if (entry->second <= 0) {
            // erase returns the iterator to what followed. Advancing an
            // iterator that has just been erased reads a freed node, and the
            // damage lands somewhere later that looks unrelated.
            entry = stock.erase(entry);
            continue;
        }
        ++entry;
    }
}

std::set<std::string> distinct(const std::vector<std::string> &words) {
    // A set does both jobs at once: it refuses duplicates and keeps what it
    // has in order. Neither is a loop anyone needs to write.
    return std::set<std::string>(words.begin(), words.end());
}

std::vector<std::string> in_both(const std::set<std::string> &left,
                                 const std::set<std::string> &right) {
    std::vector<std::string> both;
    // Both inputs are already sorted, which is the precondition these
    // algorithms need and a set gives away for free.
    std::set_intersection(left.begin(), left.end(), right.begin(), right.end(),
                          std::back_inserter(both));
    return both;
}

std::vector<std::string> only_in_left(const std::set<std::string> &left,
                                      const std::set<std::string> &right) {
    std::vector<std::string> missing;
    std::set_difference(left.begin(), left.end(), right.begin(), right.end(),
                        std::back_inserter(missing));
    return missing;
}

bool transfer(std::map<std::string, int> &stock, const std::string &from,
              const std::string &to, int count) {
    // Everything that could refuse the transfer is asked before anything is
    // changed, so a refusal cannot leave half a move behind.
    if (count <= 0) {
        return false;
    }
    if (from == to) {
        return false;
    }

    const std::map<std::string, int>::iterator source = stock.find(from);
    if (source == stock.end()) {
        return false;
    }
    if (source->second < count) {
        return false;
    }

    source->second -= count;
    stock[to] += count;
    return true;
}
