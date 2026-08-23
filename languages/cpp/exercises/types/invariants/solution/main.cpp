// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

void Inventory::add(const std::string &name, int count) {
    if (count <= 0) {
        return;
    }
    items_[name] += count;
}

bool Inventory::remove(const std::string &name, int count) {
    if (count <= 0) {
        return false;
    }
    auto it = items_.find(name);
    if (it == items_.end() || it->second < count) {
        return false;
    }

    it->second -= count;
    if (it->second == 0) {
        // The invariant: present means positive. Zero leaves the map, so
        // distinct() never counts a ghost.
        items_.erase(it);
    }
    return true;
}

int Inventory::count(const std::string &name) const {
    // find, not operator[] — the operator default-inserts, and the
    // compiler refuses it on a const map. That refusal is the invariant
    // being protected at compile time.
    auto it = items_.find(name);
    return it == items_.end() ? 0 : it->second;
}

int Inventory::total() const {
    int sum = 0;
    for (const auto &entry : items_) {
        sum += entry.second;
    }
    return sum;
}

int Inventory::distinct() const {
    return static_cast<int>(items_.size());
}

std::vector<std::string> Inventory::names_sorted() const {
    std::vector<std::string> names;
    names.reserve(items_.size());
    // std::map iterates in key order already; the sort comes free.
    for (const auto &entry : items_) {
        names.push_back(entry.first);
    }
    return names;
}
