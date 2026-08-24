// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::string_view trimmed(std::string_view text) {
    (void)text;
    return {};
}

std::vector<std::string_view> split(std::string_view text, char separator) {
    (void)text;
    (void)separator;
    return {};
}

std::string join(const std::vector<std::string_view> &parts, char separator) {
    (void)parts;
    (void)separator;
    return {};
}

bool starts_with_any(std::string_view text, const std::vector<std::string_view> &prefixes) {
    (void)text;
    (void)prefixes;
    return false;
}
