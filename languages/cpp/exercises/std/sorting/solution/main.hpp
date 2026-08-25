// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <string>
#include <vector>

struct Employee {
    std::string name;
    std::string team;
    int level = 0;
};

/** Most senior first; equal levels ordered by name. */
std::vector<Employee> by_seniority(std::vector<Employee> people);

/** Grouped by team name, keeping each team's people in the order given. */
std::vector<Employee> grouped_by_team(std::vector<Employee> people);

/** The `count` most senior, in the same order by_seniority would give. */
std::vector<Employee> top(std::vector<Employee> people, int count);

/** Whether the seniority order considers these two interchangeable. */
bool same_rank(const Employee &left, const Employee &right);
