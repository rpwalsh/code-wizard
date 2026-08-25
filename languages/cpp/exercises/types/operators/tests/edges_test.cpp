// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(the_sign_always_lives_on_the_numerator, "cpp.types.operators") {
    // Two ways of writing a negative number would make equality depend on
    // how it was typed, which is not a property numbers have.
    const Fraction negative(1, -2);
    RETRAINER_ASSERT_INT(negative.numerator(), -1);
    RETRAINER_ASSERT_INT(negative.denominator(), 2);
    RETRAINER_ASSERT_STR(negative.text(), "-1/2");
    RETRAINER_ASSERT(negative == Fraction(-1, 2), "however it was written");
}

RETRAINER_TEST(two_negatives_make_a_positive, "cpp.types.operators") {
    const Fraction positive(-3, -6);
    RETRAINER_ASSERT_STR(positive.text(), "1/2");
    RETRAINER_ASSERT(positive == Fraction(1, 2), "and equals the plain one");
}

RETRAINER_TEST(zero_is_zero_however_it_arrives, "cpp.types.operators") {
    RETRAINER_ASSERT_STR(Fraction(0, 5).text(), "0");
    RETRAINER_ASSERT_STR(Fraction(0, -5).text(), "0");
    RETRAINER_ASSERT(Fraction(0, 5) == Fraction(0), "one zero, not several");
    RETRAINER_ASSERT_INT(Fraction(0, 5).denominator(), 1);
}

RETRAINER_TEST(subtracting_to_zero_gives_zero, "cpp.types.operators") {
    RETRAINER_ASSERT_STR((Fraction(1, 3) - Fraction(1, 3)).text(), "0");
}

RETRAINER_TEST(adding_negatives_lands_the_right_way_round, "cpp.types.operators") {
    RETRAINER_ASSERT_STR((Fraction(1, 2) + Fraction(-1, 3)).text(), "1/6");
    RETRAINER_ASSERT_STR((Fraction(-1, 2) + Fraction(1, 3)).text(), "-1/6");
    RETRAINER_ASSERT_STR((Fraction(1, 2) - Fraction(-1, 2)).text(), "1");
}

RETRAINER_TEST(negative_fractions_compare_the_right_way, "cpp.types.operators") {
    // Cross multiplying with a negative denominator would flip this. Keeping
    // the denominator positive is what makes the comparison trustworthy.
    RETRAINER_ASSERT(Fraction(-1, 2) < Fraction(1, 2), "below zero is below");
    RETRAINER_ASSERT(Fraction(-1, 2) < Fraction(-1, 3), "and further below is further");
    RETRAINER_ASSERT(Fraction(-3, 4) < Fraction(-1, 2), "three quarters down is lower");
}

RETRAINER_TEST(dividing_by_zero_is_refused, "cpp.types.operators") {
    bool caught = false;
    try {
        const Fraction impossible = Fraction(1, 2) / Fraction(0, 5);
        (void)impossible;
    } catch (const std::invalid_argument &) {
        caught = true;
    }
    RETRAINER_ASSERT(caught, "not by a fraction worth nothing");
}

RETRAINER_TEST(dividing_by_a_negative_moves_the_sign_up, "cpp.types.operators") {
    RETRAINER_ASSERT_STR((Fraction(1, 2) / Fraction(-1, 4)).text(), "-2");
}

RETRAINER_TEST(multiplying_by_zero_gives_zero, "cpp.types.operators") {
    RETRAINER_ASSERT_STR((Fraction(7, 9) * Fraction(0)).text(), "0");
}

RETRAINER_TEST(a_fraction_is_not_less_than_itself, "cpp.types.operators") {
    const Fraction third(1, 3);
    RETRAINER_ASSERT(!(third < third), "nothing precedes itself");
    RETRAINER_ASSERT(!(third > third), "nor follows itself");
    RETRAINER_ASSERT(third <= third, "but it is at most itself");
}

RETRAINER_TEST(comparison_survives_large_denominators, "cpp.types.operators") {
    // Cross multiplying two large fractions overflows a 32-bit int and comes
    // back with the wrong sign. The comparison has to be done somewhere wider.
    const Fraction big(100000, 100001);
    const Fraction bigger(100001, 100002);
    RETRAINER_ASSERT(big < bigger, "the second is nearer to one");
    RETRAINER_ASSERT(!(bigger < big), "and not the other way");
}

RETRAINER_TEST(fractions_sort_like_numbers, "cpp.types.operators") {
    // A one-line proof that the synthesized operators really are usable
    // wherever the standard library expects an ordering.
    std::vector<Fraction> values{Fraction(3, 4), Fraction(-1, 2), Fraction(1, 3),
                                 Fraction(2)};
    for (std::size_t outer = 0; outer < values.size(); outer += 1) {
        for (std::size_t inner = outer + 1; inner < values.size(); inner += 1) {
            if (values[inner] < values[outer]) {
                const Fraction held = values[outer];
                values[outer] = values[inner];
                values[inner] = held;
            }
        }
    }

    RETRAINER_ASSERT_STR(values[0].text(), "-1/2");
    RETRAINER_ASSERT_STR(values[1].text(), "1/3");
    RETRAINER_ASSERT_STR(values[2].text(), "3/4");
    RETRAINER_ASSERT_STR(values[3].text(), "2");
}
