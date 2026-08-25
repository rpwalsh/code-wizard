// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_fraction_is_kept_in_lowest_terms, "cpp.types.operators") {
    const Fraction half(2, 4);
    RETRAINER_ASSERT_INT(half.numerator(), 1);
    RETRAINER_ASSERT_INT(half.denominator(), 2);
    RETRAINER_ASSERT_STR(half.text(), "1/2");
}

RETRAINER_TEST(a_whole_number_prints_without_a_denominator, "cpp.types.operators") {
    RETRAINER_ASSERT_STR(Fraction(6, 3).text(), "2");
    RETRAINER_ASSERT_STR(Fraction(5).text(), "5");
}

RETRAINER_TEST(fractions_add_and_subtract, "cpp.types.operators") {
    RETRAINER_ASSERT_STR((Fraction(1, 2) + Fraction(1, 3)).text(), "5/6");
    RETRAINER_ASSERT_STR((Fraction(3, 4) - Fraction(1, 4)).text(), "1/2");
}

RETRAINER_TEST(fractions_multiply_and_divide, "cpp.types.operators") {
    RETRAINER_ASSERT_STR((Fraction(2, 3) * Fraction(3, 4)).text(), "1/2");
    RETRAINER_ASSERT_STR((Fraction(1, 2) / Fraction(1, 4)).text(), "2");
}

RETRAINER_TEST(equal_numbers_written_differently_are_equal, "cpp.types.operators") {
    RETRAINER_ASSERT(Fraction(1, 2) == Fraction(2, 4), "one half either way");
    RETRAINER_ASSERT(!(Fraction(1, 2) == Fraction(1, 3)), "and a third is not a half");
}

RETRAINER_TEST(one_spaceship_gives_all_four_comparisons, "cpp.types.operators") {
    // None of <, >, <= or >= is written anywhere. The compiler builds each of
    // them from operator<=>, which is the entire reason it exists.
    RETRAINER_ASSERT(Fraction(1, 2) < Fraction(2, 3), "a half is less than two thirds");
    RETRAINER_ASSERT(Fraction(2, 3) > Fraction(1, 2), "and the other way round");
    RETRAINER_ASSERT(Fraction(1, 2) <= Fraction(2, 4), "equal counts as at most");
    RETRAINER_ASSERT(Fraction(1, 2) >= Fraction(2, 4), "and as at least");
}

RETRAINER_TEST(an_int_on_the_left_still_works, "cpp.types.operators") {
    // This is the test a member operator+ cannot pass. A member needs the
    // left operand to already be a Fraction; a free function lets the
    // conversion happen on either side.
    RETRAINER_ASSERT_STR((1 + Fraction(1, 2)).text(), "3/2");
    RETRAINER_ASSERT_STR((2 * Fraction(1, 4)).text(), "1/2");
}

RETRAINER_TEST(a_denominator_of_zero_is_refused, "cpp.types.operators") {
    bool caught = false;
    try {
        const Fraction impossible(1, 0);
        (void)impossible;
    } catch (const std::invalid_argument &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "nothing is divided into zero parts");
}
