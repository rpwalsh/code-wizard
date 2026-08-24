// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <iterator>
#include <numeric>

std::vector<Reading> drop_below(std::vector<Reading> readings, int floor) {
    (void)floor;
    return readings;
}

std::vector<std::string> sensors_of(const std::vector<Reading> &readings) {
    (void)readings;
    return {};
}

bool any_above(const std::vector<Reading> &readings, int ceiling) {
    (void)readings;
    (void)ceiling;
    return false;
}

int total(const std::vector<Reading> &readings) {
    (void)readings;
    return 0;
}

std::vector<Reading> sorted_by_temperature(std::vector<Reading> readings) {
    return readings;
}
