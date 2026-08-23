// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <stdexcept>

Account::Account(std::string name, long cents) : name_(std::move(name)), cents_(cents) {}

long Account::withdraw(long cents) {
    (void)cents;
    return 0;
}

void Account::deposit(long cents) {
    (void)cents;
}

void Account::close() {
    closed_ = true;
}

bool Account::closed() const {
    return closed_;
}

long Account::balance() const {
    return cents_;
}

bool transfer(Account &from, Account &to, long cents) {
    (void)from;
    (void)to;
    (void)cents;
    return false;
}

FlatFee::FlatFee(long cents) : flat(cents) {}
long FlatFee::apply(long cents) const {
    (void)cents;
    return 0;
}

PercentFee::PercentFee(int p) : percent(p) {}
long PercentFee::apply(long cents) const {
    (void)cents;
    return 0;
}

long total_fees(const std::vector<std::unique_ptr<Fee>> &fees, long cents) {
    (void)fees;
    (void)cents;
    return 0;
}

std::string_view trim(std::string_view text) {
    return text;
}

long parse_cents(std::string_view text) {
    (void)text;
    return 0;
}
