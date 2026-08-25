// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::function<int()> make_counter(int start) {
    // An init-capture makes the lambda's own variable, initialized from the
    // parameter. mutable is what allows the call operator to change it, and
    // without it this does not compile at all.
    return [value = start]() mutable {
        const int current = value;
        value += 1;
        return current;
    };
}

std::function<bool(int)> above_snapshot(int threshold) {
    // By value: the number is copied into the lambda now, and nothing that
    // happens to the caller's variable afterwards can reach it.
    return [threshold](int value) { return value > threshold; };
}

std::function<bool(int)> above_live(const int &threshold) {
    // By reference: the lambda reads the caller's variable each time. Useful
    // when the answer is meant to track a value, and a dangling read the
    // moment that variable outlives its scope before the lambda does.
    return [&threshold](int value) { return value > threshold; };
}

std::vector<int> filter(const std::vector<int> &values,
                        const std::function<bool(int)> &keep) {
    std::vector<int> kept;
    for (const int value : values) {
        if (keep(value)) {
            kept.push_back(value);
        }
    }
    return kept;
}

int apply_all(int start, const std::vector<std::function<int(int)>> &actions) {
    int running = start;
    for (const std::function<int(int)> &action : actions) {
        running = action(running);
    }
    return running;
}
