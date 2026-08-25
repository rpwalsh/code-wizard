// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <optional>
#include <string>
#include <vector>

/**
 * A scoped enumeration, which is the only kind worth using.
 *
 * The names live inside Level rather than leaking into the surrounding scope,
 * and none of them turns into an int without being asked. Both of those are
 * things the old `enum` gets wrong.
 */
enum class Level { debug, info, warning, error, fatal };

/** One line of a log. */
struct LogLine {
    Level level = Level::info;
    std::string text;
};

/** The level's name in lower case: "debug", "info", and so on. */
std::string name(Level level);

/** The level with that name, or nothing at all. */
std::optional<Level> parse_level(const std::string &text);

/** Whether the level is at least as serious as the threshold. */
bool at_least(Level level, Level threshold);

/** The text of every line at or above the threshold, in order. */
std::vector<std::string> at_or_above(const std::vector<LogLine> &lines, Level threshold);

/** The most serious level present. An empty list is `debug`. */
Level worst(const std::vector<Level> &levels);

/** How far up the scale the level sits, counting debug as zero. */
int severity(Level level);
