// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <cstddef>
#include <unordered_map>
#include <unordered_set>
#include <vector>

struct Point {
    int x = 0;
    int y = 0;
};

/** Two points are the same point when both coordinates match. */
bool operator==(const Point &left, const Point &right);

/**
 * The hash, as a function object rather than a std::hash specialization.
 *
 * Both work. This one keeps the whole exercise in main.cpp, and it is what
 * you reach for when the hash is specific to one container rather than to
 * the type itself.
 */
struct PointHash {
    std::size_t operator()(const Point &point) const;
};

using PointCounts = std::unordered_map<Point, int, PointHash>;
using PointSet = std::unordered_set<Point, PointHash>;

/** How many times each point appears. */
PointCounts tally(const std::vector<Point> &points);

/** How many times that point appears, or zero. Must not insert anything. */
int count_at(const PointCounts &counts, const Point &wanted);

/** The distinct points, in the order they were first seen. */
std::vector<Point> distinct(const std::vector<Point> &points);

/** The points as a set. */
PointSet unique_set(const std::vector<Point> &points);
