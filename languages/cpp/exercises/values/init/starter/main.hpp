// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <string>
#include <vector>

/**
 * Settings with defaults written where the members are declared.
 *
 * Every constructor would otherwise have to repeat them, and one of those
 * constructors would eventually repeat them wrongly.
 */
struct Settings {
    int retries = 3;
    int timeout_ms = 1000;
    bool verbose = false;
};

/** `count` copies of `value`. */
std::vector<int> repeated(int count, int value);

/** A vector holding exactly those two numbers, in that order. */
std::vector<int> exactly(int first, int second);

/** Settings as declared, with nothing changed. */
Settings defaults();

/** The defaults, except for the retry count. */
Settings with_retries(int retries);

/** A copy of the settings with verbose turned on. */
Settings louder(const Settings &base);

/** "retries=3 timeout=1000 verbose=no". */
std::string describe(const Settings &settings);
