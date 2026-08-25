// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

void drop_empty(std::map<std::string, int> &stock) {
    (void)stock;
}

std::set<std::string> distinct(const std::vector<std::string> &words) {
    (void)words;
    return {};
}

std::vector<std::string> in_both(const std::set<std::string> &left,
                                 const std::set<std::string> &right) {
    (void)left;
    (void)right;
    return {};
}

std::vector<std::string> only_in_left(const std::set<std::string> &left,
                                      const std::set<std::string> &right) {
    (void)left;
    (void)right;
    return {};
}

bool transfer(std::map<std::string, int> &stock, const std::string &from,
              const std::string &to, int count) {
    (void)stock;
    (void)from;
    (void)to;
    (void)count;
    return false;
}
