// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

Fraction::Fraction(int whole) {
    (void)whole;
}

Fraction::Fraction(int numerator, int denominator) {
    (void)numerator;
    (void)denominator;
}

int Fraction::numerator() const {
    return numerator_;
}

int Fraction::denominator() const {
    return denominator_;
}

std::string Fraction::text() const {
    return "";
}

Fraction operator+(const Fraction &left, const Fraction &right) {
    (void)right;
    return left;
}

Fraction operator-(const Fraction &left, const Fraction &right) {
    (void)right;
    return left;
}

Fraction operator*(const Fraction &left, const Fraction &right) {
    (void)right;
    return left;
}

Fraction operator/(const Fraction &left, const Fraction &right) {
    (void)right;
    return left;
}

bool operator==(const Fraction &left, const Fraction &right) {
    (void)left;
    (void)right;
    return false;
}

std::strong_ordering operator<=>(const Fraction &left, const Fraction &right) {
    (void)left;
    (void)right;
    return std::strong_ordering::equal;
}
