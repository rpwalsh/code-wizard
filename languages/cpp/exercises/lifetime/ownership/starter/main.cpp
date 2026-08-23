// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <utility>

void Registry::add(std::string, int) {}
const Entry *Registry::find(std::string_view) const { return nullptr; }
std::unique_ptr<Entry> Registry::take(std::string_view) { return nullptr; }
std::size_t Registry::size() const { return 0; }
