// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <optional>
#include <span>

/**
 * A span is a pointer and a length over contiguous values it does not own.
 *
 * Taking one means a single function serves a vector, a std::array and a
 * plain C array without a template and without copying any of them. It also
 * means the same warning as std::string_view: it is valid only as long as
 * whatever it points into.
 */

/** Every value added together. */
int total(std::span<const int> values);

/** The largest value, or nothing when there are none. */
std::optional<int> largest(std::span<const int> values);

/** Every value doubled, in the caller's own storage. */
void double_all(std::span<int> values);

/** The first `count` values, or all of them if there are fewer. */
std::span<const int> take(std::span<const int> values, int count);

/** Everything after the first `count` values. */
std::span<const int> drop(std::span<const int> values, int count);
