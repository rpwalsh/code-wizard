// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <cstddef>

int total(std::span<const int> values) {
    int sum = 0;
    for (const int value : values) {
        sum += value;
    }
    return sum;
}

std::optional<int> largest(std::span<const int> values) {
    if (values.empty()) {
        return std::nullopt;
    }
    return *std::max_element(values.begin(), values.end());
}

void double_all(std::span<int> values) {
    // span<int> rather than span<const int>, so this reaches the caller's own
    // storage. The const in the others is not decoration: it is the
    // difference between a window you may write through and one you may not.
    for (int &value : values) {
        value *= 2;
    }
}

std::span<const int> take(std::span<const int> values, int count) {
    if (count <= 0) {
        return values.first(0);
    }
    // Clamped, because first() past the end is undefined rather than short.
    const std::size_t keep = std::min(values.size(), static_cast<std::size_t>(count));
    return values.first(keep);
}

std::span<const int> drop(std::span<const int> values, int count) {
    if (count <= 0) {
        return values;
    }
    const std::size_t skip = std::min(values.size(), static_cast<std::size_t>(count));
    return values.subspan(skip);
}
