// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::vector<int> repeated(int count, int value) {
    (void)count;
    (void)value;
    return {};
}

std::vector<int> exactly(int first, int second) {
    (void)first;
    (void)second;
    return {};
}

Settings defaults() {
    return Settings{};
}

Settings with_retries(int retries) {
    (void)retries;
    return Settings{};
}

Settings louder(const Settings &base) {
    return base;
}

std::string describe(const Settings &settings) {
    (void)settings;
    return "";
}
