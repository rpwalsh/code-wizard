// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

int total(std::span<const int> values) {
    (void)values;
    return 0;
}

std::optional<int> largest(std::span<const int> values) {
    (void)values;
    return std::nullopt;
}

void double_all(std::span<int> values) {
    (void)values;
}

std::span<const int> take(std::span<const int> values, int count) {
    (void)count;
    return values;
}

std::span<const int> drop(std::span<const int> values, int count) {
    (void)count;
    return values;
}
