// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
/** A Point, spelled without braces so it can sit inside an assertion macro. */
Point at(int x, int y) {
    return Point{x, y};
}
}  // namespace

RETRAINER_TEST(two_points_with_the_same_coordinates_are_equal, "cpp.std.hashing") {
    RETRAINER_ASSERT(at(1, 2) == at(1, 2), "same coordinates, same point");
    RETRAINER_ASSERT(!(at(1, 2) == at(1, 3)), "a different y is a different point");
    RETRAINER_ASSERT(!(at(1, 2) == at(3, 2)), "and so is a different x");
}

RETRAINER_TEST(equal_points_hash_the_same, "cpp.std.hashing") {
    // The rule the whole container depends on. Two equal keys that hash
    // differently land in different buckets, and the map holds both.
    const PointHash hash;
    RETRAINER_ASSERT(hash(at(4, 7)) == hash(at(4, 7)), "equal keys, equal hashes");
}

RETRAINER_TEST(points_are_counted, "cpp.std.hashing") {
    const std::vector<Point> points{{1, 1}, {2, 2}, {1, 1}, {1, 1}};
    const PointCounts counts = tally(points);

    RETRAINER_ASSERT_INT((int)counts.size(), 2);
    RETRAINER_ASSERT_INT(count_at(counts, at(1, 1)), 3);
    RETRAINER_ASSERT_INT(count_at(counts, at(2, 2)), 1);
}

RETRAINER_TEST(a_point_that_was_never_seen_counts_zero, "cpp.std.hashing") {
    const PointCounts counts = tally({{1, 1}});
    RETRAINER_ASSERT_INT(count_at(counts, at(9, 9)), 0);
}

RETRAINER_TEST(distinct_points_keep_first_seen_order, "cpp.std.hashing") {
    const std::vector<Point> points{{3, 3}, {1, 1}, {3, 3}, {2, 2}};
    const std::vector<Point> firsts = distinct(points);

    RETRAINER_ASSERT_INT((int)firsts.size(), 3);
    if (firsts.size() < 3) return;
    RETRAINER_ASSERT(firsts[0] == at(3, 3), "the first one seen");
    RETRAINER_ASSERT(firsts[1] == at(1, 1), "then the second");
    RETRAINER_ASSERT(firsts[2] == at(2, 2), "then the third");
}

RETRAINER_TEST(a_set_holds_each_point_once, "cpp.std.hashing") {
    const PointSet points = unique_set({{1, 1}, {1, 1}, {2, 2}});
    RETRAINER_ASSERT_INT((int)points.size(), 2);
    RETRAINER_ASSERT(points.count(at(1, 1)) == 1, "one of those");
    RETRAINER_ASSERT(points.count(at(5, 5)) == 0, "and none of that");
}
