// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>

bool contains(const std::vector<int> &sorted, int wanted) {
    return std::binary_search(sorted.begin(), sorted.end(), wanted);
}

int insertion_point(const std::vector<int> &sorted, int wanted) {
    // lower_bound: the first position not less than wanted. That is where it
    // belongs, and it is also where its equals begin.
    const std::vector<int>::const_iterator at =
        std::lower_bound(sorted.begin(), sorted.end(), wanted);
    return static_cast<int>(at - sorted.begin());
}

int count_of(const std::vector<int> &sorted, int wanted) {
    // equal_range is both bounds in one pass: everything equal to wanted sits
    // between them, so the distance is the count.
    const std::pair<std::vector<int>::const_iterator, std::vector<int>::const_iterator>
        range = std::equal_range(sorted.begin(), sorted.end(), wanted);
    return static_cast<int>(range.second - range.first);
}

std::optional<int> first_at_least(const std::vector<int> &sorted, int wanted) {
    const std::vector<int>::const_iterator at =
        std::lower_bound(sorted.begin(), sorted.end(), wanted);
    if (at == sorted.end()) {
        // Everything is smaller. end() is a position, not a value, and
        // reading through it is the commonest way to misuse these.
        return std::nullopt;
    }
    return *at;
}

void insert_sorted(std::vector<int> &sorted, int value) {
    // Insert at the lower bound, so equal values go in front of their equals
    // and the vector stays sorted without another pass over it.
    sorted.insert(std::lower_bound(sorted.begin(), sorted.end(), value), value);
}
