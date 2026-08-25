// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
std::vector<Employee> staff() {
    return {
        {"nadia", "infra", 5},
        {"omar", "web", 7},
        {"priya", "infra", 5},
        {"quinn", "web", 3},
    };
}
}  // namespace

RETRAINER_TEST(the_most_senior_come_first, "cpp.std.sorting") {
    const std::vector<Employee> ordered = by_seniority(staff());
    RETRAINER_ASSERT_INT((int)ordered.size(), 4);
    if (ordered.size() < 4) return;
    RETRAINER_ASSERT_STR(ordered[0].name, "omar");
    RETRAINER_ASSERT_STR(ordered[3].name, "quinn");
}

RETRAINER_TEST(equal_levels_are_ordered_by_name, "cpp.std.sorting") {
    const std::vector<Employee> ordered = by_seniority(staff());
    RETRAINER_ASSERT_INT((int)ordered.size(), 4);
    if (ordered.size() < 4) return;
    RETRAINER_ASSERT_STR(ordered[1].name, "nadia");
    RETRAINER_ASSERT_STR(ordered[2].name, "priya");
}

RETRAINER_TEST(teams_are_grouped_together, "cpp.std.sorting") {
    const std::vector<Employee> grouped = grouped_by_team(staff());
    RETRAINER_ASSERT_INT((int)grouped.size(), 4);
    if (grouped.size() < 4) return;
    RETRAINER_ASSERT_STR(grouped[0].team, "infra");
    RETRAINER_ASSERT_STR(grouped[1].team, "infra");
    RETRAINER_ASSERT_STR(grouped[2].team, "web");
    RETRAINER_ASSERT_STR(grouped[3].team, "web");
}

RETRAINER_TEST(within_a_team_the_arrival_order_survives, "cpp.std.sorting") {
    const std::vector<Employee> grouped = grouped_by_team(staff());
    RETRAINER_ASSERT_INT((int)grouped.size(), 4);
    if (grouped.size() < 4) return;
    RETRAINER_ASSERT_STR(grouped[0].name, "nadia");
    RETRAINER_ASSERT_STR(grouped[1].name, "priya");
    RETRAINER_ASSERT_STR(grouped[2].name, "omar");
    RETRAINER_ASSERT_STR(grouped[3].name, "quinn");
}

RETRAINER_TEST(the_top_few_are_the_most_senior_few, "cpp.std.sorting") {
    const std::vector<Employee> best = top(staff(), 2);
    RETRAINER_ASSERT_INT((int)best.size(), 2);
    if (best.size() < 2) return;
    RETRAINER_ASSERT_STR(best[0].name, "omar");
    RETRAINER_ASSERT_STR(best[1].name, "nadia");
}

RETRAINER_TEST(the_same_level_and_name_rank_together, "cpp.std.sorting") {
    const Employee left{"sam", "infra", 4};
    const Employee right{"sam", "web", 4};
    RETRAINER_ASSERT(same_rank(left, right), "the ordering does not look at the team");
    RETRAINER_ASSERT(!same_rank(left, Employee{"sam", "infra", 5}), "levels differ");
    RETRAINER_ASSERT(!same_rank(left, Employee{"tam", "infra", 4}), "names differ");
}
