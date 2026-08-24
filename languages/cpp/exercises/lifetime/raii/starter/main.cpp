// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <utility>

std::vector<std::string> &journal() {
    static std::vector<std::string> entries;
    return entries;
}

void clear_journal() {
    journal().clear();
}

Session::Session(std::string name) : name_(std::move(name)) {
    // Journal the opening.
}

Session::~Session() {
    // Journal the closing.
}

ScopeGuard::ScopeGuard(std::function<void()> action)
    : action_(std::move(action)), live_(false) {
}

ScopeGuard::~ScopeGuard() {
    // Run the action, unless this guard was dismissed.
}

void ScopeGuard::dismiss() {
}

void with_session(const std::string &name, const std::function<void()> &body) {
    (void)name;
    body();
}

void transact(const std::function<void()> &body) {
    body();
}
