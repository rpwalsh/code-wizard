// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <cstddef>

namespace {

/**
 * Strictly before, never "before or equal to".
 *
 * std::sort requires a strict weak ordering, which above all means a value is
 * not before itself. A comparator written with <= satisfies nothing, and the
 * standard's answer to that is undefined behavior rather than a wrong order:
 * the usual symptom is the sort walking off the end of the range.
 */
bool more_senior(const Employee &left, const Employee &right) {
    if (left.level > right.level) {
        return true;
    }
    if (left.level < right.level) {
        return false;
    }
    // Levels tie, so the name decides. Two people with the same level and
    // name fall through to a plain false, which is what makes this strict.
    return left.name < right.name;
}

}  // namespace

std::vector<Employee> by_seniority(std::vector<Employee> people) {
    std::sort(people.begin(), people.end(), more_senior);
    return people;
}

std::vector<Employee> grouped_by_team(std::vector<Employee> people) {
    // stable_sort, because the order within a team is meant to be the order
    // they arrived in. Plain sort is free to rearrange equivalent elements,
    // so the same input could come back two different ways.
    std::stable_sort(people.begin(), people.end(),
                     [](const Employee &left, const Employee &right) {
                         return left.team < right.team;
                     });
    return people;
}

std::vector<Employee> top(std::vector<Employee> people, int count) {
    if (count <= 0) {
        return {};
    }

    const std::size_t keep = std::min(people.size(), static_cast<std::size_t>(count));
    // Only the first `keep` need to be in order, and partial_sort says so.
    // The rest are left in an unspecified order, which is fine because they
    // are about to be discarded.
    std::partial_sort(people.begin(), people.begin() + static_cast<long>(keep),
                      people.end(), more_senior);
    people.resize(keep);
    return people;
}

bool same_rank(const Employee &left, const Employee &right) {
    // Equivalence under an ordering: neither one comes first. This is what
    // sorting means by equal, and it is not the same as the two objects being
    // identical — they differ in team, and the ordering does not look there.
    if (more_senior(left, right)) {
        return false;
    }
    return !more_senior(right, left);
}
