// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <stdexcept>

std::optional<Reading> find_reading(const std::vector<Reading> &readings,
                                    std::string_view sensor) {
    (void)readings;
    (void)sensor;
    throw std::logic_error("not implemented");
}

std::optional<Reading> highest(const std::vector<Reading> &readings) {
    (void)readings;
    throw std::logic_error("not implemented");
}

std::optional<double> average(const std::vector<Reading> &readings) {
    (void)readings;
    throw std::logic_error("not implemented");
}

std::vector<std::string> sensors(const std::vector<Reading> &readings) {
    (void)readings;
    throw std::logic_error("not implemented");
}

double value_or(const std::vector<Reading> &readings, std::string_view sensor,
                double fallback) {
    (void)readings;
    (void)sensor;
    (void)fallback;
    throw std::logic_error("not implemented");
}
