// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <compare>
#include <stdexcept>
#include <string>

/**
 * An exact fraction, always kept in lowest terms with a positive denominator.
 *
 * The constructor taking a single int is deliberately not explicit. For a
 * numeric type that is the convention and the reason `1 + half` can work at
 * all; for almost any other kind of type it would be a mistake.
 */
class Fraction {
  public:
    Fraction(int whole);
    Fraction(int numerator, int denominator);

    int numerator() const;
    int denominator() const;

    /** "3/4", or just "3" when the denominator is one. */
    std::string text() const;

  private:
    int numerator_ = 0;
    int denominator_ = 1;
};

// Free functions, not members, so the left operand converts too.
Fraction operator+(const Fraction &left, const Fraction &right);
Fraction operator-(const Fraction &left, const Fraction &right);
Fraction operator*(const Fraction &left, const Fraction &right);
Fraction operator/(const Fraction &left, const Fraction &right);

bool operator==(const Fraction &left, const Fraction &right);
std::strong_ordering operator<=>(const Fraction &left, const Fraction &right);
