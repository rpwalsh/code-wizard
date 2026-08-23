// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <map>
#include <string>
#include <vector>

/**
 * Item names to positive counts. The invariant: present means positive —
 * an item at zero leaves the map, so no reader meets a ghost.
 *
 * Rule of zero: no destructor, no copy/move anything. std::map manages
 * itself, and the compiler-generated operations compose it correctly.
 */
class Inventory {
public:
    void add(const std::string &name, int count);
    bool remove(const std::string &name, int count);

    int count(const std::string &name) const;
    int total() const;
    int distinct() const;
    std::vector<std::string> names_sorted() const;

private:
    std::map<std::string, int> items_;
};

#endif /* MAIN_HPP */
