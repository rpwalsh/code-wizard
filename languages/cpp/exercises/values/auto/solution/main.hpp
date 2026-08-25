// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <map>
#include <string>
#include <vector>

/**
 * A reading that counts its own copies.
 *
 * Provided for you. Type deduction is invisible by nature — the compiler
 * decides and says nothing — so this counter is how the tests can tell what
 * it decided.
 */
struct Reading {
    std::string sensor;
    int value;

    Reading(std::string sensor, int value);
    Reading(const Reading &other);
    Reading &operator=(const Reading &other);

    static int copies();
    static void reset_copies();
};

/** Add `amount` to every reading, in place. */
void raise_all(std::vector<Reading> &readings, int amount);

/** Every value added together, copying nothing. */
int total(const std::vector<Reading> &readings);

/** One `sensor=value` string per entry, in the map's order. */
std::vector<std::string> label_all(const std::map<std::string, int> &values);

/** A pointer to the first reading above the threshold, or nullptr. */
const Reading *first_above(const std::vector<Reading> &readings, int threshold);
