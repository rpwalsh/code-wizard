// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <type_traits>

std::string render(const Cell &cell) {
    // std::visit calls the one branch that matches what is actually stored.
    // Leave a case out and this does not compile, which is the difference
    // between a variant and a tag field somebody forgot to switch on.
    return std::visit(
        [](const auto &held) -> std::string {
            using Held = std::decay_t<decltype(held)>;
            if constexpr (std::is_same_v<Held, Blank>) {
                return "";
            } else if constexpr (std::is_same_v<Held, Number>) {
                return std::to_string(held.value);
            } else if constexpr (std::is_same_v<Held, Text>) {
                return held.value;
            } else {
                return "#ERR: " + held.reason;
            }
        },
        cell);
}

std::optional<int> as_number(const Cell &cell) {
    // get_if returns a pointer when the variant holds that type and null
    // otherwise, which makes asking about one case cheap and safe.
    if (std::get_if<Blank>(&cell) != nullptr) {
        return 0;
    }
    const Number *number = std::get_if<Number>(&cell);
    if (number != nullptr) {
        return number->value;
    }
    return std::nullopt;
}

Cell total(const std::vector<Cell> &cells) {
    int sum = 0;
    for (const Cell &cell : cells) {
        const Failure *failure = std::get_if<Failure>(&cell);
        if (failure != nullptr) {
            // The first failure, returned as it stands. Continuing would add
            // up the cells around a broken one and report the result as fine.
            return *failure;
        }

        const Number *number = std::get_if<Number>(&cell);
        if (number != nullptr) {
            sum += number->value;
        }
    }
    return Number{sum};
}

Tally tally(const std::vector<Cell> &cells) {
    Tally counts;
    for (const Cell &cell : cells) {
        // index() is which alternative is held, in the order they were
        // declared. holds_alternative<T> asks the same question by name,
        // which survives somebody reordering the list.
        if (std::holds_alternative<Blank>(cell)) {
            counts.blanks += 1;
            continue;
        }
        if (std::holds_alternative<Number>(cell)) {
            counts.numbers += 1;
            continue;
        }
        if (std::holds_alternative<Text>(cell)) {
            counts.texts += 1;
            continue;
        }
        counts.failures += 1;
    }
    return counts;
}
