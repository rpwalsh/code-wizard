// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::string name(Level level) {
    (void)level;
    return "";
}

std::optional<Level> parse_level(const std::string &text) {
    (void)text;
    return std::nullopt;
}

bool at_least(Level level, Level threshold) {
    (void)level;
    (void)threshold;
    return false;
}

std::vector<std::string> at_or_above(const std::vector<LogLine> &lines, Level threshold) {
    (void)lines;
    (void)threshold;
    return {};
}

Level worst(const std::vector<Level> &levels) {
    (void)levels;
    return Level::debug;
}

int severity(Level level) {
    (void)level;
    return 0;
}
