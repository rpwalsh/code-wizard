// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

void Catalog::add(const std::string &sku, int cents) {
    (void)sku;
    (void)cents;
}

std::optional<int> Catalog::price(const std::string &sku) const {
    (void)sku;
    return std::nullopt;
}

int Catalog::lookups() const {
    return 0;
}

int Catalog::total() const {
    return 0;
}

std::vector<std::string> Catalog::skus() const {
    return {};
}

std::string dearest(const Catalog &catalog) {
    (void)catalog;
    return "";
}
