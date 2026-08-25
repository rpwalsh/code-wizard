// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <numeric>

namespace {
/** Two fractions cross-multiplied, in a type wide enough not to wrap. */
long long cross(const Fraction &left, const Fraction &right) {
    return static_cast<long long>(left.numerator()) * right.denominator();
}
}  // namespace

Fraction::Fraction(int whole) : numerator_(whole), denominator_(1) {
}

Fraction::Fraction(int numerator, int denominator) {
    if (denominator == 0) {
        throw std::invalid_argument("a fraction cannot have a denominator of zero");
    }

    // The sign lives on the numerator, always. Two representations of the
    // same number would make equality a matter of how it was written down.
    if (denominator < 0) {
        numerator = -numerator;
        denominator = -denominator;
    }

    // The denominator is positive by now and gcd(0, d) is d, so the divisor
    // is at least one and there is no zero case left to guard against.
    const int divisor = std::gcd(numerator, denominator);
    numerator_ = numerator / divisor;
    denominator_ = denominator / divisor;
}

int Fraction::numerator() const {
    return numerator_;
}

int Fraction::denominator() const {
    return denominator_;
}

std::string Fraction::text() const {
    if (denominator_ == 1) {
        return std::to_string(numerator_);
    }
    return std::to_string(numerator_) + "/" + std::to_string(denominator_);
}

Fraction operator+(const Fraction &left, const Fraction &right) {
    return Fraction(left.numerator() * right.denominator() +
                        right.numerator() * left.denominator(),
                    left.denominator() * right.denominator());
}

Fraction operator-(const Fraction &left, const Fraction &right) {
    return Fraction(left.numerator() * right.denominator() -
                        right.numerator() * left.denominator(),
                    left.denominator() * right.denominator());
}

Fraction operator*(const Fraction &left, const Fraction &right) {
    return Fraction(left.numerator() * right.numerator(),
                    left.denominator() * right.denominator());
}

Fraction operator/(const Fraction &left, const Fraction &right) {
    if (right.numerator() == 0) {
        throw std::invalid_argument("cannot divide by a fraction worth zero");
    }
    return Fraction(left.numerator() * right.denominator(),
                    left.denominator() * right.numerator());
}

bool operator==(const Fraction &left, const Fraction &right) {
    // Both sides are in lowest terms with a positive denominator, so equal
    // numbers have identical parts and this needs no arithmetic.
    if (left.numerator() != right.numerator()) {
        return false;
    }
    return left.denominator() == right.denominator();
}

std::strong_ordering operator<=>(const Fraction &left, const Fraction &right) {
    // a/b against c/d is a*d against c*b, and the denominators are positive
    // so the comparison does not flip.
    return cross(left, right) <=> cross(right, left);
}
