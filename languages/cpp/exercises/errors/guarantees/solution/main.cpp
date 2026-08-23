// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <stdexcept>

Account::Account(std::string name, long cents) : name_(std::move(name)), cents_(cents) {}

long Account::withdraw(long cents) {
    if (cents <= 0) {
        throw std::invalid_argument("withdrawal must be positive");
    }
    if (cents > cents_) {
        throw std::runtime_error("insufficient funds in " + name_);
    }
    cents_ -= cents;
    return cents_;
}

void Account::deposit(long cents) {
    if (closed_) {
        throw std::runtime_error("account " + name_ + " is closed");
    }
    cents_ += cents;
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
    from.withdraw(cents);
    try {
        to.deposit(cents);
    } catch (...) {
        // The strong guarantee, earned by hand: undo the half-done work,
        // then let the original exception keep traveling.
        from.deposit(cents);
        throw;
    }
    return true;
}

FlatFee::FlatFee(long cents) : flat(cents) {}
long FlatFee::apply(long cents) const {
    (void)cents;
    return flat;
}

PercentFee::PercentFee(int p) : percent(p) {}
long PercentFee::apply(long cents) const {
    return cents * percent / 100;
}

long total_fees(const std::vector<std::unique_ptr<Fee>> &fees, long cents) {
    long total = 0;
    for (const auto &fee : fees) {
        // Virtual dispatch through the base — and virtual ~Fee is what
        // makes owning these through unique_ptr<Fee> defined behavior.
        total += fee->apply(cents);
    }
    return total;
}

std::string_view trim(std::string_view text) {
    const auto first = text.find_first_not_of(" \t");
    if (first == std::string_view::npos) {
        return text.substr(0, 0);
    }
    const auto last = text.find_last_not_of(" \t");
    // substr on a view moves a pointer and a length. No allocation
    // happened anywhere in this function.
    return text.substr(first, last - first + 1);
}

static bool all_digits(std::string_view text) {
    if (text.empty()) {
        return false;
    }
    for (char c : text) {
        if (c < '0' || c > '9') {
            return false;
        }
    }
    return true;
}

long parse_cents(std::string_view text) {
    const std::string_view original = text;
    const auto refuse = [original]() {
        throw std::invalid_argument("not an amount: " + std::string(original));
    };

    bool negative = false;
    if (!text.empty() && text.front() == '-') {
        negative = true;
        text.remove_prefix(1);
    }

    std::string_view whole = text;
    std::string_view fraction;
    const auto dot = text.find('.');
    if (dot != std::string_view::npos) {
        whole = text.substr(0, dot);
        fraction = text.substr(dot + 1);
        if (fraction.find('.') != std::string_view::npos) {
            refuse();
        }
        if (fraction.empty() || fraction.size() > 2 || !all_digits(fraction)) {
            refuse();
        }
    }
    if (!all_digits(whole)) {
        refuse();
    }

    long cents = 0;
    for (char c : whole) {
        cents = cents * 10 + (c - '0');
    }
    cents *= 100;

    if (!fraction.empty()) {
        long extra = (fraction[0] - '0') * 10;
        if (fraction.size() == 2) {
            extra += fraction[1] - '0';
        }
        cents += extra;
    }

    return negative ? -cents : cents;
}
