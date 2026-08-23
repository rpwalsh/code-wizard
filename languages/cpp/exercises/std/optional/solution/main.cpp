// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <numeric>

std::optional<Reading> find_reading(const std::vector<Reading> &readings,
                                    std::string_view sensor) {
    const auto found = std::find_if(readings.begin(), readings.end(),
                                    [&](const Reading &reading) {
                                        return reading.sensor == sensor;
                                    });

    if (found == readings.end()) {
        return std::nullopt;
    }
    return *found;
}

std::optional<Reading> highest(const std::vector<Reading> &readings) {
    // max_element returns the *first* greatest element, which is the
    // tie-breaking rule the prompt asks for — no extra code needed.
    const auto found = std::max_element(readings.begin(), readings.end(),
                                        [](const Reading &left, const Reading &right) {
                                            return left.value < right.value;
                                        });

    if (found == readings.end()) {
        return std::nullopt;
    }
    return *found;
}

std::optional<double> average(const std::vector<Reading> &readings) {
    // Zero is a plausible average, so it cannot double as "nothing to average".
    if (readings.empty()) {
        return std::nullopt;
    }

    const double total =
        std::accumulate(readings.begin(), readings.end(), 0.0,
                        [](double running, const Reading &reading) {
                            return running + reading.value;
                        });

    return total / static_cast<double>(readings.size());
}

std::vector<std::string> sensors(const std::vector<Reading> &readings) {
    std::vector<std::string> names;
    names.reserve(readings.size());
    for (const Reading &reading : readings) {
        names.push_back(reading.sensor);
    }

    std::sort(names.begin(), names.end());

    // unique only shuffles the duplicates to the end and hands back the new
    // logical end; without the erase the vector keeps its original length.
    names.erase(std::unique(names.begin(), names.end()), names.end());
    return names;
}

double value_or(const std::vector<Reading> &readings, std::string_view sensor,
                double fallback) {
    const std::optional<Reading> found = find_reading(readings, sensor);
    return found.has_value() ? found->value : fallback;
}
