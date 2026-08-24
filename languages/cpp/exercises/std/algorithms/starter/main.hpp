// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef RETRAINER_MAIN_HPP
#define RETRAINER_MAIN_HPP

#include <string>
#include <vector>

struct Reading {
    std::string sensor;
    int celsius;
};

std::vector<Reading> drop_below(std::vector<Reading> readings, int floor);
std::vector<std::string> sensors_of(const std::vector<Reading> &readings);
bool any_above(const std::vector<Reading> &readings, int ceiling);
int total(const std::vector<Reading> &readings);
std::vector<Reading> sorted_by_temperature(std::vector<Reading> readings);

#endif
