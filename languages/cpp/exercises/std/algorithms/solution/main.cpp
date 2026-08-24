// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <iterator>
#include <numeric>

std::vector<Reading> drop_below(std::vector<Reading> readings, int floor) {
    // remove_if does not remove anything. It shuffles the survivors to the
    // front and returns where they end; the vector is still the same size,
    // with unspecified values in the tail. erase is the half that removes.
    auto unwanted = std::remove_if(readings.begin(), readings.end(),
                                   [floor](const Reading &reading) {
                                       return reading.celsius < floor;
                                   });
    readings.erase(unwanted, readings.end());
    return readings;
}

std::vector<std::string> sensors_of(const std::vector<Reading> &readings) {
    std::vector<std::string> names;
    names.reserve(readings.size());
    std::transform(readings.begin(), readings.end(), std::back_inserter(names),
                   [](const Reading &reading) { return reading.sensor; });
    return names;
}

bool any_above(const std::vector<Reading> &readings, int ceiling) {
    return std::any_of(readings.begin(), readings.end(),
                       [ceiling](const Reading &reading) {
                           return reading.celsius > ceiling;
                       });
}

int total(const std::vector<Reading> &readings) {
    // The 0 is not decoration: accumulate's type comes from the initial
    // value, so passing 0.0 here would sum in double and truncate once.
    return std::accumulate(readings.begin(), readings.end(), 0,
                           [](int running, const Reading &reading) {
                               return running + reading.celsius;
                           });
}

std::vector<Reading> sorted_by_temperature(std::vector<Reading> readings) {
    // stable_sort, so readings at the same temperature keep the order they
    // arrived in. sort is free to reorder them and is not reproducible.
    std::stable_sort(readings.begin(), readings.end(),
                     [](const Reading &left, const Reading &right) {
                         return left.celsius < right.celsius;
                     });
    return readings;
}
