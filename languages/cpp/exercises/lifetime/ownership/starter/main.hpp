// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <cstddef>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

struct Entry {
    std::string name;
    int value;
};

/**
 * A registry that owns its entries.
 *
 * Declared here and defined in main.cpp, so more than one test file can use it
 * without defining it twice.
 */
class Registry {
public:
    void add(std::string name, int value);
    const Entry *find(std::string_view name) const;
    std::unique_ptr<Entry> take(std::string_view name);
    std::size_t size() const;

private:
    std::vector<std::unique_ptr<Entry>> entries_;
};

#endif /* MAIN_HPP */
