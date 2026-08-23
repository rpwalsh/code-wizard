// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <optional>
#include <string>
#include <string_view>
#include <vector>

struct Reading {
    std::string sensor;
    double value;
};

/** The first reading from that sensor, or nothing. */
std::optional<Reading> find_reading(const std::vector<Reading> &readings,
                                    std::string_view sensor);

/** The greatest reading; the earlier one on a tie. Nothing when empty. */
std::optional<Reading> highest(const std::vector<Reading> &readings);

/** The mean, or nothing — the mean of no readings is not zero. */
std::optional<double> average(const std::vector<Reading> &readings);

/** Each sensor name once, sorted. */
std::vector<std::string> sensors(const std::vector<Reading> &readings);

/** The reading's value, or the fallback. */
double value_or(const std::vector<Reading> &readings, std::string_view sensor,
                double fallback);

#endif /* MAIN_HPP */
