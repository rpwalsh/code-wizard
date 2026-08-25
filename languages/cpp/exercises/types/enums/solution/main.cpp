// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::string name(Level level) {
    // A switch with no default. Add a sixth level and the compiler points at
    // this function instead of letting it quietly return an empty string.
    switch (level) {
        case Level::debug:
            return "debug";
        case Level::info:
            return "info";
        case Level::warning:
            return "warning";
        case Level::error:
            return "error";
        case Level::fatal:
            return "fatal";
    }
    return "";
}

std::optional<Level> parse_level(const std::string &text) {
    const Level all[] = {Level::debug, Level::info, Level::warning, Level::error,
                         Level::fatal};
    for (const Level level : all) {
        if (name(level) == text) {
            return level;
        }
    }
    return std::nullopt;
}

int severity(Level level) {
    // The one place the numbering is relied on, and it says so. A scoped
    // enum does not convert on its own, which is why static_cast is needed
    // and why the conversion is easy to find later.
    return static_cast<int>(level);
}

bool at_least(Level level, Level threshold) {
    // Scoped enums compare directly, in declaration order. No cast needed
    // here, because comparing two Levels is a question about Levels.
    return level >= threshold;
}

std::vector<std::string> at_or_above(const std::vector<LogLine> &lines, Level threshold) {
    std::vector<std::string> kept;
    for (const LogLine &line : lines) {
        if (at_least(line.level, threshold)) {
            kept.push_back(line.text);
        }
    }
    return kept;
}

Level worst(const std::vector<Level> &levels) {
    Level highest = Level::debug;
    for (const Level level : levels) {
        if (level > highest) {
            highest = level;
        }
    }
    return highest;
}
