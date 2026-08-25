// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::function<int()> make_counter(int start) {
    (void)start;
    return [] { return 0; };
}

std::function<bool(int)> above_snapshot(int threshold) {
    (void)threshold;
    return [](int value) { (void)value; return false; };
}

std::function<bool(int)> above_live(const int &threshold) {
    (void)threshold;
    return [](int value) { (void)value; return false; };
}

std::vector<int> filter(const std::vector<int> &values,
                        const std::function<bool(int)> &keep) {
    (void)values;
    (void)keep;
    return {};
}

int apply_all(int start, const std::vector<std::function<int(int)>> &actions) {
    (void)actions;
    return start;
}
