// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::string render(const Cell &cell) {
    (void)cell;
    return "";
}

std::optional<int> as_number(const Cell &cell) {
    (void)cell;
    return std::nullopt;
}

Cell total(const std::vector<Cell> &cells) {
    (void)cells;
    return Blank{};
}

Tally tally(const std::vector<Cell> &cells) {
    (void)cells;
    return Tally{};
}
