// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(sorting_nothing_gives_nothing, "cpp.std.sorting") {
    RETRAINER_ASSERT_INT((int)by_seniority({}).size(), 0);
    RETRAINER_ASSERT_INT((int)grouped_by_team({}).size(), 0);
    RETRAINER_ASSERT_INT((int)top({}, 3).size(), 0);
}

RETRAINER_TEST(sorting_one_gives_that_one, "cpp.std.sorting") {
    const std::vector<Employee> one{{"solo", "infra", 2}};
    const std::vector<Employee> ordered = by_seniority(one);
    RETRAINER_ASSERT_INT((int)ordered.size(), 1);
    if (ordered.empty()) return;
    RETRAINER_ASSERT_STR(ordered[0].name, "solo");
}

RETRAINER_TEST(nobody_outranks_themselves, "cpp.std.sorting") {
    // The rule std::sort actually requires. A comparator built on <= says a
    // value comes before itself, and the standard's answer to that is not a
    // wrong order — it is undefined behavior, usually a walk off the end.
    const Employee person{"sam", "infra", 4};
    RETRAINER_ASSERT(same_rank(person, person), "a person ranks with themselves");
}

RETRAINER_TEST(asking_for_more_than_there_are_gives_all_of_them, "cpp.std.sorting") {
    const std::vector<Employee> best = top({{"a", "x", 1}, {"b", "x", 2}}, 50);
    RETRAINER_ASSERT_INT((int)best.size(), 2);
    if (best.size() < 2) return;
    RETRAINER_ASSERT_STR(best[0].name, "b");
}

RETRAINER_TEST(asking_for_none_gives_none, "cpp.std.sorting") {
    const std::vector<Employee> people{{"a", "x", 1}};
    RETRAINER_ASSERT_INT((int)top(people, 0).size(), 0);
    RETRAINER_ASSERT_INT((int)top(people, -4).size(), 0);
}

RETRAINER_TEST(the_top_one_is_the_single_most_senior, "cpp.std.sorting") {
    const std::vector<Employee> people{
        {"a", "x", 1}, {"b", "x", 9}, {"c", "x", 4}};
    const std::vector<Employee> best = top(people, 1);
    RETRAINER_ASSERT_INT((int)best.size(), 1);
    if (best.empty()) return;
    RETRAINER_ASSERT_STR(best[0].name, "b");
}

RETRAINER_TEST(everyone_at_the_same_level_is_ordered_by_name, "cpp.std.sorting") {
    const std::vector<Employee> people{
        {"zoe", "x", 3}, {"adam", "x", 3}, {"mia", "x", 3}};
    const std::vector<Employee> ordered = by_seniority(people);
    RETRAINER_ASSERT_INT((int)ordered.size(), 3);
    if (ordered.size() < 3) return;
    RETRAINER_ASSERT_STR(ordered[0].name, "adam");
    RETRAINER_ASSERT_STR(ordered[1].name, "mia");
    RETRAINER_ASSERT_STR(ordered[2].name, "zoe");
}

RETRAINER_TEST(one_team_stays_entirely_in_arrival_order, "cpp.std.sorting") {
    const std::vector<Employee> people{
        {"third", "x", 1}, {"first", "x", 9}, {"second", "x", 5}};
    const std::vector<Employee> grouped = grouped_by_team(people);
    RETRAINER_ASSERT_INT((int)grouped.size(), 3);
    if (grouped.size() < 3) return;
    RETRAINER_ASSERT_STR(grouped[0].name, "third");
    RETRAINER_ASSERT_STR(grouped[1].name, "first");
    RETRAINER_ASSERT_STR(grouped[2].name, "second");
}

RETRAINER_TEST(the_caller_vector_is_untouched, "cpp.std.sorting") {
    // Taken by value, so the caller's order survives however much the sort
    // rearranges the copy.
    std::vector<Employee> people{{"b", "x", 1}, {"a", "x", 9}};
    by_seniority(people);
    grouped_by_team(people);
    top(people, 1);

    RETRAINER_ASSERT_INT((int)people.size(), 2);
    if (people.size() < 2) return;
    RETRAINER_ASSERT_STR(people[0].name, "b");
}

RETRAINER_TEST(ranking_is_about_the_order_not_the_object, "cpp.std.sorting") {
    // Two different people, interchangeable as far as the sort is concerned.
    // Equivalent is not equal, and a comparator only promises the former.
    RETRAINER_ASSERT(same_rank(Employee{"kit", "alpha", 6}, Employee{"kit", "omega", 6}),
                     "same level and name, different team");
    RETRAINER_ASSERT(!same_rank(Employee{"kit", "alpha", 6}, Employee{"kit", "alpha", 7}),
                     "one level apart is not interchangeable");
}

RETRAINER_TEST(negative_levels_sort_below_everything, "cpp.std.sorting") {
    const std::vector<Employee> people{{"a", "x", -1}, {"b", "x", 0}};
    const std::vector<Employee> ordered = by_seniority(people);
    RETRAINER_ASSERT_INT((int)ordered.size(), 2);
    if (ordered.size() < 2) return;
    RETRAINER_ASSERT_STR(ordered[0].name, "b");
    RETRAINER_ASSERT_STR(ordered[1].name, "a");
}
