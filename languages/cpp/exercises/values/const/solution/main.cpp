// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

void Catalog::add(const std::string &sku, int cents) {
    prices_[sku] = cents;
    // The remembered sum is now a lie about a catalog that has changed.
    total_.reset();
}

std::optional<int> Catalog::price(const std::string &sku) const {
    lookups_ += 1;

    // find, not operator[]. Subscripting a map inserts when the key is
    // missing, which is why a const map does not offer it at all.
    const std::map<std::string, int>::const_iterator found = prices_.find(sku);
    if (found == prices_.end()) {
        return std::nullopt;
    }
    return found->second;
}

int Catalog::lookups() const {
    return lookups_;
}

int Catalog::total() const {
    if (total_.has_value()) {
        return total_.value();
    }

    int sum = 0;
    for (const std::pair<const std::string, int> &entry : prices_) {
        sum += entry.second;
    }
    total_ = sum;
    return sum;
}

std::vector<std::string> Catalog::skus() const {
    std::vector<std::string> names;
    for (const std::pair<const std::string, int> &entry : prices_) {
        names.push_back(entry.first);
    }
    return names;
}

std::string dearest(const Catalog &catalog) {
    // A const reference, so only the const members are reachable. Everything
    // below is a question, and none of it is a change.
    std::string best;
    // An optional rather than a zero, because there is no price low enough to
    // stand in for "nothing seen yet" once a sku can legitimately cost zero.
    std::optional<int> highest;
    for (const std::string &sku : catalog.skus()) {
        const std::optional<int> cents = catalog.price(sku);
        if (!cents.has_value()) {
            continue;
        }
        if (!highest.has_value()) {
            best = sku;
            highest = cents;
            continue;
        }
        if (cents.value() > highest.value()) {
            best = sku;
            highest = cents;
        }
    }
    return best;
}
