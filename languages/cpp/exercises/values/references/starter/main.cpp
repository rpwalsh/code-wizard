// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

Counter &counter_for(Counters &counters, const std::string &name) {
    return counters[name];
}

const Counter *find_counter(const Counters &counters, const std::string &name) {
    (void)counters;
    (void)name;
    return nullptr;
}

void bump_all(Counters &counters) {
    (void)counters;
}

int total_hits(const Counters &counters) {
    (void)counters;
    return 0;
}

const int &larger(const int &left, const int &right) {
    (void)right;
    return left;
}

void exchange(int &left, int &right) {
    (void)left;
    (void)right;
}
