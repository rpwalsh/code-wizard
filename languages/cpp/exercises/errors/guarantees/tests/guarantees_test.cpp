// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdexcept>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(withdrawals_succeed_and_refuse, "cpp.errors.exceptions") {
    Account account("ada", 1000);
    RETRAINER_ASSERT_INT(static_cast<int>(account.withdraw(300)), 700);

    bool threw = false;
    try {
        account.withdraw(5000);
    } catch (const std::runtime_error &error) {
        threw = std::string(error.what()).find("insufficient") != std::string::npos;
    }
    RETRAINER_ASSERT(threw, "an overdraft throws runtime_error naming the problem");
    RETRAINER_ASSERT_INT(static_cast<int>(account.balance()), 700);
}

RETRAINER_TEST(a_transfer_moves_money, "cpp.errors.guarantees") {
    Account from("a", 1000);
    Account to("b", 0);
    RETRAINER_ASSERT(transfer(from, to, 400), "transfer should succeed");
    RETRAINER_ASSERT_INT(static_cast<int>(from.balance()), 600);
    RETRAINER_ASSERT_INT(static_cast<int>(to.balance()), 400);
}

RETRAINER_TEST(fees_dispatch_through_the_base, "cpp.types.polymorphism") {
    std::vector<std::unique_ptr<Fee>> fees;
    fees.push_back(std::make_unique<FlatFee>(50));
    fees.push_back(std::make_unique<PercentFee>(2));
    RETRAINER_ASSERT_INT(static_cast<int>(total_fees(fees, 10000)), 250);
}

RETRAINER_TEST(trim_returns_a_view_into_the_input, "cpp.std.strings") {
    const std::string owner = "  \thello world\t ";
    std::string_view trimmed = trim(owner);
    RETRAINER_ASSERT(trimmed == "hello world", "both ends trimmed");
    RETRAINER_ASSERT(trimmed.data() >= owner.data() &&
                         trimmed.data() < owner.data() + owner.size(),
                     "the view points into the original — no allocation");
}

RETRAINER_TEST(amounts_parse_to_cents, "cpp.std.strings") {
    RETRAINER_ASSERT_INT(static_cast<int>(parse_cents("12.50")), 1250);
    RETRAINER_ASSERT_INT(static_cast<int>(parse_cents("7")), 700);
    RETRAINER_ASSERT_INT(static_cast<int>(parse_cents("0.05")), 5);
    RETRAINER_ASSERT_INT(static_cast<int>(parse_cents("-3.20")), -320);
}
