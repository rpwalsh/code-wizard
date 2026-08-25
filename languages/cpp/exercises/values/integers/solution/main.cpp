// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <cstddef>
#include <limits>

int mean(const std::vector<int> &values) {
    if (values.empty()) {
        return 0;
    }

    // long long for the running total. A thousand values near the top of an
    // int overflow long before the division brings the answer back in range,
    // and signed overflow is undefined rather than merely wrong.
    long long sum = 0;
    for (const int value : values) {
        sum += value;
    }
    return static_cast<int>(sum / static_cast<long long>(values.size()));
}

bool would_overflow(int left, int right) {
    // Asked before the addition, never after. Testing the result for
    // wrongness means the overflow already happened, and the standard does
    // not promise the program is still meaningful at that point.
    if (right > 0) {
        return left > std::numeric_limits<int>::max() - right;
    }
    // Zero and negative together. Adding zero cannot overflow, and this line
    // says so on its own: left < min - 0 is left < min, which is never true.
    return left < std::numeric_limits<int>::min() - right;
}

std::optional<int> checked_add(int left, int right) {
    if (would_overflow(left, right)) {
        return std::nullopt;
    }
    return left + right;
}

int last_index(const std::vector<int> &values) {
    // size() is unsigned, so size() - 1 on an empty vector is not -1: it is
    // the largest value a size_t can hold. Checking first is the whole job.
    if (values.empty()) {
        return -1;
    }
    return static_cast<int>(values.size()) - 1;
}

int modulo(int value, int divisor) {
    if (divisor <= 0) {
        throw std::invalid_argument("the divisor must be positive");
    }

    // C++ gives the remainder the sign of the left operand, so -1 % 3 is -1
    // rather than 2. That is correct arithmetic and the wrong answer for an
    // index into a ring, which is what this is usually for.
    const int rest = value % divisor;
    if (rest < 0) {
        return rest + divisor;
    }
    return rest;
}
