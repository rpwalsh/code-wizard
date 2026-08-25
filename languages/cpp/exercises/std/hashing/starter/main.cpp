// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

bool operator==(const Point &left, const Point &right) {
    (void)left;
    (void)right;
    return false;
}

std::size_t PointHash::operator()(const Point &point) const {
    (void)point;
    return 0;
}

PointCounts tally(const std::vector<Point> &points) {
    (void)points;
    return {};
}

int count_at(const PointCounts &counts, const Point &wanted) {
    (void)counts;
    (void)wanted;
    return 0;
}

std::vector<Point> distinct(const std::vector<Point> &points) {
    (void)points;
    return {};
}

PointSet unique_set(const std::vector<Point> &points) {
    (void)points;
    return {};
}
