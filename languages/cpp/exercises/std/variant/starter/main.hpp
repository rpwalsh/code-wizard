// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <optional>
#include <string>
#include <variant>
#include <vector>

/** A cell nobody has filled in. */
struct Blank {};

/** A cell holding a whole number. */
struct Number {
    int value = 0;
};

/** A cell holding text. */
struct Text {
    std::string value;
};

/** A cell whose formula did not work out. */
struct Failure {
    std::string reason;
};

/**
 * Exactly one of the four, and the compiler knows which cases exist.
 *
 * Not a base class with four children and a virtual method, and not a struct
 * with four fields and three of them unused. One value, one of four shapes,
 * and no room for a fifth state that nobody wrote a branch for.
 */
using Cell = std::variant<Blank, Number, Text, Failure>;

/** How the cell reads on screen: "", "42", the text itself, or "#ERR: why". */
std::string render(const Cell &cell);

/** The number in the cell. A blank is zero; text and failures are nothing. */
std::optional<int> as_number(const Cell &cell);

/**
 * Every numeric cell added up, as a cell.
 *
 * Blanks count as zero and text is skipped, the way a spreadsheet does it. A
 * failure anywhere makes the whole total that same failure — the first one.
 */
Cell total(const std::vector<Cell> &cells);

/** How many cells of each kind there are. */
struct Tally {
    int blanks = 0;
    int numbers = 0;
    int texts = 0;
    int failures = 0;
};

Tally tally(const std::vector<Cell> &cells);
