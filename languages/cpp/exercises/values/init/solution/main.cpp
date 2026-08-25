// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::vector<int> repeated(int count, int value) {
    // Parentheses reach the (count, value) constructor. Braces would not:
    // any vector constructible from an initializer list prefers that one, and
    // this would become a vector of two numbers.
    return std::vector<int>(static_cast<std::size_t>(count), value);
}

std::vector<int> exactly(int first, int second) {
    // Braces, and this time that is the point.
    return std::vector<int>{first, second};
}

Settings defaults() {
    // Value-initialized, so every member takes the default written beside it.
    return Settings{};
}

Settings with_retries(int retries) {
    // A designated initializer names the member it is setting. The two it
    // does not name keep their declared defaults, and the line stays correct
    // if somebody adds a fourth setting tomorrow.
    return Settings{.retries = retries};
}

Settings louder(const Settings &base) {
    Settings copy = base;
    copy.verbose = true;
    return copy;
}

std::string describe(const Settings &settings) {
    std::string verbose = "no";
    if (settings.verbose) {
        verbose = "yes";
    }
    return "retries=" + std::to_string(settings.retries) + " timeout=" +
           std::to_string(settings.timeout_ms) + " verbose=" + verbose;
}
