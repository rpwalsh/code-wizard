// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <utility>

Counter &counter_for(Counters &counters, const std::string &name) {
    // operator[] inserts a default-constructed Counter when the name is new,
    // and returns a reference either way. Here that insertion is wanted, so
    // the operator everywhere else is a trap is the right tool.
    return counters[name];
}

const Counter *find_counter(const Counters &counters, const std::string &name) {
    const Counters::const_iterator found = counters.find(name);
    if (found == counters.end()) {
        // A reference cannot express this. There is no null reference, so a
        // function that might have nothing to refer to returns a pointer.
        return nullptr;
    }
    return &found->second;
}

void bump_all(Counters &counters) {
    // auto & — a reference to each entry. Plain auto copies the pair, and the
    // loop then raises a copy that is discarded at the closing brace.
    for (auto &[name, counter] : counters) {
        (void)name;
        counter.hits += 1;
    }
}

int total_hits(const Counters &counters) {
    int sum = 0;
    for (const auto &[name, counter] : counters) {
        (void)name;
        sum += counter.hits;
    }
    return sum;
}

const int &larger(const int &left, const int &right) {
    // Returns a reference to one of the arguments, so the caller's own
    // variable comes back rather than a copy of its value. Which also means
    // this must never be called on a temporary — the reference would outlive
    // what it refers to.
    if (right > left) {
        return right;
    }
    return left;
}

void exchange(int &left, int &right) {
    const int held = left;
    left = right;
    right = held;
}
