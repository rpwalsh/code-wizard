// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <functional>

bool operator==(const Point &left, const Point &right) {
    if (left.x != right.x) {
        return false;
    }
    return left.y == right.y;
}

std::size_t PointHash::operator()(const Point &point) const {
    const std::hash<int> hash_int;
    std::size_t seed = hash_int(point.x);

    // Not a plain XOR. `a ^ b` is symmetric, so (1, 2) and (2, 1) would land
    // in the same bucket — and a grid of coordinates is exactly the data that
    // has a mirror image of every point in it. The shifts and the constant
    // break the symmetry, which is all they are for.
    seed ^= hash_int(point.y) + 0x9e3779b9U + (seed << 6) + (seed >> 2);
    return seed;
}

PointCounts tally(const std::vector<Point> &points) {
    PointCounts counts;
    for (const Point &point : points) {
        // Here the inserting behavior of operator[] is wanted: a point not
        // seen before starts at zero and is immediately raised to one.
        counts[point] += 1;
    }
    return counts;
}

int count_at(const PointCounts &counts, const Point &wanted) {
    const PointCounts::const_iterator found = counts.find(wanted);
    if (found == counts.end()) {
        return 0;
    }
    return found->second;
}

std::vector<Point> distinct(const std::vector<Point> &points) {
    std::vector<Point> firsts;
    PointSet seen;
    for (const Point &point : points) {
        // insert reports whether it happened, which is the membership test
        // and the record of it in one lookup rather than two.
        if (seen.insert(point).second) {
            firsts.push_back(point);
        }
    }
    return firsts;
}

PointSet unique_set(const std::vector<Point> &points) {
    return PointSet(points.begin(), points.end());
}
