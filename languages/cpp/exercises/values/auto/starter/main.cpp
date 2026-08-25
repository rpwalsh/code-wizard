// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <utility>

namespace {
int copy_count = 0;
}  // namespace

// Provided: the bookkeeping that makes deduction visible.
Reading::Reading(std::string sensor, int value)
    : sensor(std::move(sensor)), value(value) {
}

Reading::Reading(const Reading &other) : sensor(other.sensor), value(other.value) {
    copy_count += 1;
}

Reading &Reading::operator=(const Reading &other) {
    sensor = other.sensor;
    value = other.value;
    copy_count += 1;
    return *this;
}

int Reading::copies() {
    return copy_count;
}

void Reading::reset_copies() {
    copy_count = 0;
}

void raise_all(std::vector<Reading> &readings, int amount) {
    (void)readings;
    (void)amount;
}

int total(const std::vector<Reading> &readings) {
    (void)readings;
    return 0;
}

std::vector<std::string> label_all(const std::map<std::string, int> &values) {
    (void)values;
    return {};
}

const Reading *first_above(const std::vector<Reading> &readings, int threshold) {
    (void)readings;
    (void)threshold;
    return nullptr;
}
