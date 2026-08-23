// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <concepts>
#include <string>
#include <vector>

/**
 * Written from the body's actual needs: average adds values together and
 * divides by a count, so that — and only that — is what the door checks.
 */
template <typename T>
concept Averageable = requires(T a) {
    { a + a } -> std::convertible_to<T>;
    a / 2;
};

template <Averageable T>
T average(const std::vector<T> &values) {
    if (values.empty()) {
        return T{};
    }
    T sum = T{};
    for (const T &value : values) {
        sum = sum + value;
    }
    return sum / static_cast<int>(values.size());
}

/**
 * Unconstrained on purpose: a lambda's type is unnameable, and the body's
 * single call site produces a short error on its own. Concepts where they
 * pay; plain templates where they do not.
 */
template <typename T, typename Predicate>
std::vector<T> keep_if(const std::vector<T> &values, Predicate keep) {
    std::vector<T> kept;
    for (const T &value : values) {
        if (keep(value)) {
            kept.push_back(value);
        }
    }
    return kept;
}

template <typename T>
concept Describable = requires(const T item) {
    { item.describe() } -> std::convertible_to<std::string>;
};

template <Describable T>
std::string join_descriptions(const std::vector<T> &items) {
    std::string joined;
    bool first = true;
    for (const T &item : items) {
        if (!first) {
            joined += ", ";
        }
        joined += item.describe();
        first = false;
    }
    return joined;
}

#endif /* MAIN_HPP */
