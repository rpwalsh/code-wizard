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
    // auto & — a reference to each element. Plain `auto` here deduces
    // Reading, so the loop would raise a copy and throw it away, leaving the
    // vector untouched and nothing to explain why.
    for (auto &reading : readings) {
        reading.value += amount;
    }
}

int total(const std::vector<Reading> &readings) {
    int sum = 0;
    // const auto & — bind to each element without copying it. This function
    // only reads, and reading should not cost an allocation per element.
    for (const auto &reading : readings) {
        sum += reading.value;
    }
    return sum;
}

std::vector<std::string> label_all(const std::map<std::string, int> &values) {
    std::vector<std::string> labels;
    // A structured binding names the two halves of each pair, which beats
    // entry.first and entry.second at every reading of this line forever.
    for (const auto &[sensor, value] : values) {
        labels.push_back(sensor + "=" + std::to_string(value));
    }
    return labels;
}

const Reading *first_above(const std::vector<Reading> &readings, int threshold) {
    for (const auto &reading : readings) {
        if (reading.value > threshold) {
            // The address of the element itself, which is only meaningful
            // because the loop bound a reference rather than a copy.
            return &reading;
        }
    }
    return nullptr;
}
