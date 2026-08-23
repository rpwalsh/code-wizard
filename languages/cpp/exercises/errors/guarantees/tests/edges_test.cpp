// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdexcept>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_failed_transfer_rolls_back, "cpp.errors.guarantees") {
    Account from("a", 1000);
    Account to("b", 0);
    to.close();

    bool threw = false;
    try {
        transfer(from, to, 400);
    } catch (const std::runtime_error &) {
        threw = true;
    }

    RETRAINER_ASSERT(threw, "the failure still propagates");
    // The strong guarantee: the withdrawal was undone before the throw
    // escaped, so the caller sees the error AND unchanged balances.
    RETRAINER_ASSERT_INT(static_cast<int>(from.balance()), 1000);
    RETRAINER_ASSERT_INT(static_cast<int>(to.balance()), 0);
}

RETRAINER_TEST(bad_withdrawals_are_invalid_argument, "cpp.errors.exceptions") {
    Account account("a", 100);
    bool threw = false;
    try {
        account.withdraw(0);
    } catch (const std::invalid_argument &) {
        threw = true;
    }
    RETRAINER_ASSERT(threw, "zero is not a withdrawal");
    RETRAINER_ASSERT_INT(static_cast<int>(account.balance()), 100);
}

RETRAINER_TEST(trim_of_blank_is_empty_not_crash, "cpp.std.strings") {
    RETRAINER_ASSERT(trim("   \t ").empty(), "all whitespace trims to nothing");
    RETRAINER_ASSERT(trim("").empty(), "empty stays empty");
    RETRAINER_ASSERT(trim("solid") == "solid", "nothing to trim");
}

RETRAINER_TEST(garbage_amounts_throw_naming_the_input, "cpp.std.strings") {
    const char *bad[] = {"", "abc", "1.2.3", "1.234", "12.", ".", "-", "1a"};
    for (const char *text : bad) {
        bool threw = false;
        try {
            parse_cents(text);
        } catch (const std::invalid_argument &error) {
            threw = std::string(error.what()).find("not an amount") != std::string::npos;
        }
        RETRAINER_ASSERT(threw, text);
    }
}

RETRAINER_TEST(single_decimal_digits_mean_tens_of_cents, "cpp.std.strings") {
    RETRAINER_ASSERT_INT(static_cast<int>(parse_cents("3.5")), 350);
}

RETRAINER_TEST(no_fees_is_zero, "cpp.types.polymorphism") {
    std::vector<std::unique_ptr<Fee>> none;
    RETRAINER_ASSERT_INT(static_cast<int>(total_fees(none, 999)), 0);
}
