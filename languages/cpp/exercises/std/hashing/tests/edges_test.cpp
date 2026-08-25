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

RETRAINER_TEST(a_point_and_its_mirror_do_not_collide, "cpp.std.hashing") {
    // The test a plain XOR fails. `a ^ b` is symmetric, so (1, 2) and (2, 1)
    // hash identically — and a grid of coordinates contains the mirror image
    // of very nearly every point in it, so the table degrades to a list.
    const PointHash hash;
    RETRAINER_ASSERT(hash(at(1, 2)) != hash(at(2, 1)),
                     "swapping the coordinates must change the hash");
    RETRAINER_ASSERT(hash(at(3, 9)) != hash(at(9, 3)), "and again further out");
}

RETRAINER_TEST(a_point_does_not_collide_with_the_origin, "cpp.std.hashing") {
    // Another failure mode of XOR: (n, n) hashes to zero for every n, so the
    // whole diagonal lands in one bucket along with the origin.
    const PointHash hash;
    RETRAINER_ASSERT(hash(at(4, 4)) != hash(at(0, 0)), "the diagonal is not the origin");
    RETRAINER_ASSERT(hash(at(7, 7)) != hash(at(4, 4)), "nor is it all one bucket");
}

RETRAINER_TEST(equality_looks_at_both_coordinates, "cpp.std.hashing") {
    RETRAINER_ASSERT(!(at(0, 1) == at(1, 0)), "mirrored is not equal");
    RETRAINER_ASSERT(at(0, 0) == at(0, 0), "the origin equals itself");
}

RETRAINER_TEST(negative_coordinates_work_like_any_other, "cpp.std.hashing") {
    const std::vector<Point> points{{-1, -1}, {-1, -1}, {1, 1}};
    const PointCounts counts = tally(points);
    RETRAINER_ASSERT_INT((int)counts.size(), 2);
    RETRAINER_ASSERT_INT(count_at(counts, at(-1, -1)), 2);

    const PointHash hash;
    RETRAINER_ASSERT(hash(at(-1, 2)) != hash(at(2, -1)), "still not symmetric");
}

RETRAINER_TEST(counting_nothing_gives_an_empty_map, "cpp.std.hashing") {
    const PointCounts counts = tally({});
    RETRAINER_ASSERT_INT((int)counts.size(), 0);
    RETRAINER_ASSERT_INT(count_at(counts, at(1, 1)), 0);
}

RETRAINER_TEST(distinct_of_nothing_is_nothing, "cpp.std.hashing") {
    RETRAINER_ASSERT_INT((int)distinct({}).size(), 0);
    RETRAINER_ASSERT_INT((int)unique_set({}).size(), 0);
}

RETRAINER_TEST(looking_up_a_missing_point_does_not_add_it, "cpp.std.hashing") {
    // count_at takes a const map, so operator[] is not available to it at
    // all. Reaching for the familiar syntax would fail to compile rather
    // than quietly grow the map by one entry per failed lookup.
    PointCounts counts = tally({{1, 1}});
    count_at(counts, at(9, 9));
    count_at(counts, at(8, 8));
    RETRAINER_ASSERT_INT((int)counts.size(), 1);
}

RETRAINER_TEST(every_point_distinct_keeps_every_point, "cpp.std.hashing") {
    const std::vector<Point> points{{1, 1}, {2, 2}, {3, 3}};
    RETRAINER_ASSERT_INT((int)distinct(points).size(), 3);
}

RETRAINER_TEST(all_the_same_point_keeps_one, "cpp.std.hashing") {
    const std::vector<Point> points{{5, 5}, {5, 5}, {5, 5}};
    const std::vector<Point> firsts = distinct(points);
    RETRAINER_ASSERT_INT((int)firsts.size(), 1);
    if (firsts.empty()) return;
    RETRAINER_ASSERT(firsts[0] == at(5, 5), "and it is that one");

    const PointCounts counts = tally(points);
    RETRAINER_ASSERT_INT(count_at(counts, at(5, 5)), 3);
}

RETRAINER_TEST(a_large_spread_of_points_all_land_separately, "cpp.std.hashing") {
    // Not a distribution test — just that a hundred distinct points really
    // are a hundred distinct keys once equality and hashing agree.
    std::vector<Point> points;
    for (int x = 0; x < 10; x += 1) {
        for (int y = 0; y < 10; y += 1) {
            points.push_back(Point{x, y});
        }
    }

    const PointCounts counts = tally(points);
    RETRAINER_ASSERT_INT((int)counts.size(), 100);
    RETRAINER_ASSERT_INT(count_at(counts, at(7, 3)), 1);
    RETRAINER_ASSERT_INT((int)unique_set(points).size(), 100);
}
