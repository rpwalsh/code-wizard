// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <utility>

/**
 * A registry that owns its entries.
 *
 * The vector of unique_ptr is the ownership statement: when the registry is
 * destroyed, every entry it still holds is freed, on every exit path,
 * including an exception. That is RAII, and it is why no destructor is needed
 * here at all.
 */
void Registry::add(std::string name, int value) {
    entries_.push_back(std::make_unique<Entry>(Entry{std::move(name), value}));
}

/** A view, not a transfer: the registry still owns what this points at. */
const Entry *Registry::find(std::string_view name) const {
    for (const auto &entry : entries_) {
        if (entry->name == name) return entry.get();
    }
    return nullptr;
}

/** Ownership moves to the caller, visibly, in the return type. */
std::unique_ptr<Entry> Registry::take(std::string_view name) {
    auto found = std::find_if(entries_.begin(), entries_.end(), [&](const auto &entry) {
        return entry->name == name;
    });
    if (found == entries_.end()) return nullptr;

    auto owned = std::move(*found);
    entries_.erase(found);
    return owned;
}

std::size_t Registry::size() const { return entries_.size(); }
