// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <optional>
#include <stdexcept>
#include <vector>

/** The average, rounded toward zero. An empty list averages zero. */
int mean(const std::vector<int> &values);

/** Whether left + right would not fit in an int. */
bool would_overflow(int left, int right);

/** left + right, or nothing at all if that sum does not fit. */
std::optional<int> checked_add(int left, int right);

/** The index of the last element, or -1 when there is no last element. */
int last_index(const std::vector<int> &values);

/**
 * A remainder that is never negative: always in [0, divisor).
 *
 * A divisor of zero or below throws std::invalid_argument.
 */
int modulo(int value, int divisor);
