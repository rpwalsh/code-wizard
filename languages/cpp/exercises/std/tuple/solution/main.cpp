// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <cctype>
#include <cstddef>

namespace {

bool all_digits(const std::string &text) {
    if (text.empty()) {
        return false;
    }
    for (std::size_t index = 0; index < text.size(); index += 1) {
        if (std::isdigit(static_cast<unsigned char>(text[index])) == 0) {
            return false;
        }
    }
    return true;
}

int to_int(const std::string &text) {
    int value = 0;
    for (std::size_t index = 0; index < text.size(); index += 1) {
        value = value * 10 + (text[index] - '0');
    }
    return value;
}

std::vector<std::string> split_on_slashes(const std::string &text) {
    std::vector<std::string> parts;
    std::size_t start = 0;
    while (true) {
        const std::size_t slash = text.find('/', start);
        if (slash == std::string::npos) {
            parts.push_back(text.substr(start));
            return parts;
        }
        parts.push_back(text.substr(start, slash - start));
        start = slash + 1;
    }
}

}  // namespace

std::pair<int, int> range_of(const std::vector<int> &values) {
    if (values.empty()) {
        throw std::invalid_argument("an empty list has no range");
    }

    // minmax_element walks once and returns both ends, which beats two passes
    // and removes any chance of the two disagreeing about the input.
    const std::pair<std::vector<int>::const_iterator, std::vector<int>::const_iterator>
        ends = std::minmax_element(values.begin(), values.end());
    return {*ends.first, *ends.second};
}

std::tuple<std::string, int, int> parse_entry(const std::string &text) {
    const std::vector<std::string> parts = split_on_slashes(text);
    if (parts.size() != 3) {
        throw std::invalid_argument("not an entry: " + text);
    }
    if (parts[0].empty()) {
        throw std::invalid_argument("not an entry: " + text);
    }
    if (!all_digits(parts[1])) {
        throw std::invalid_argument("not an entry: " + text);
    }
    if (!all_digits(parts[2])) {
        throw std::invalid_argument("not an entry: " + text);
    }
    return {parts[0], to_int(parts[1]), to_int(parts[2])};
}

std::tuple<int, int, int> summarize(const std::vector<int> &values) {
    if (values.empty()) {
        return {0, 0, 0};
    }

    int sum = 0;
    for (const int value : values) {
        sum += value;
    }
    const int count = static_cast<int>(values.size());
    return {sum, count, sum / count};
}

std::vector<std::pair<std::string, int>> by_score(
    std::vector<std::pair<std::string, int>> entries) {
    std::sort(entries.begin(), entries.end(),
              [](const std::pair<std::string, int> &left,
                 const std::pair<std::string, int> &right) {
                  // Written out rather than as a tie, because the two keys
                  // run in opposite directions and the clever one-liner for
                  // that is genuinely hard to read back.
                  if (left.second > right.second) {
                      return true;
                  }
                  if (left.second < right.second) {
                      return false;
                  }
                  return left.first < right.first;
              });
    return entries;
}
