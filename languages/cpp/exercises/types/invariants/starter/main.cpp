// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

void Inventory::add(const std::string &name, int count) {
    (void)name;
    (void)count;
}

bool Inventory::remove(const std::string &name, int count) {
    (void)name;
    (void)count;
    return false;
}

int Inventory::count(const std::string &name) const {
    (void)name;
    return -1;
}

int Inventory::total() const {
    return -1;
}

int Inventory::distinct() const {
    return -1;
}

std::vector<std::string> Inventory::names_sorted() const {
    return {};
}
