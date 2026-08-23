// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <memory>
#include <string>
#include <string_view>
#include <vector>

class Account {
public:
    Account(std::string name, long cents);

    long withdraw(long cents);
    void deposit(long cents);
    void close();
    bool closed() const;
    long balance() const;

private:
    std::string name_;
    long cents_;
    bool closed_ = false;
};

/** Strong guarantee: on any failure, both balances are exactly as before. */
bool transfer(Account &from, Account &to, long cents);

struct Fee {
    virtual long apply(long cents) const = 0;
    virtual ~Fee() = default;
};

struct FlatFee : Fee {
    explicit FlatFee(long cents);
    long apply(long cents) const override;
    long flat;
};

struct PercentFee : Fee {
    explicit PercentFee(int percent);
    long apply(long cents) const override;
    int percent;
};

long total_fees(const std::vector<std::unique_ptr<Fee>> &fees, long cents);

std::string_view trim(std::string_view text);

long parse_cents(std::string_view text);

#endif /* MAIN_HPP */
