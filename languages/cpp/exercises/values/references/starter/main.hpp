// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <map>
#include <string>

struct Counter {
    int hits = 0;
};

using Counters = std::map<std::string, Counter>;

/** A reference to the counter for `name`, created at zero if it is new. */
Counter &counter_for(Counters &counters, const std::string &name);

/**
 * A pointer to the counter for `name`, or nullptr when there is none.
 *
 * A pointer rather than a reference precisely because it can be absent. A
 * reference always refers to something, which is the whole reason to prefer
 * one — and the reason it cannot answer this question.
 */
const Counter *find_counter(const Counters &counters, const std::string &name);

/** One added to every counter, in the caller's map. */
void bump_all(Counters &counters);

/** Every counter added together, copying nothing. */
int total_hits(const Counters &counters);

/** A reference to whichever value is larger. A tie gives the left one. */
const int &larger(const int &left, const int &right);

/** The two values exchanged, in the caller's own variables. */
void exchange(int &left, int &right);
