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
    journal().push_back("open " + name_);
}

Session::~Session() {
    // Nothing here throws. A destructor that throws while an exception is
    // already traveling reaches std::terminate, so cleanup is written to be
    // incapable of failing rather than careful about failing.
    journal().push_back("close " + name_);
}

ScopeGuard::ScopeGuard(std::function<void()> action)
    : action_(std::move(action)), live_(true) {
}

ScopeGuard::~ScopeGuard() {
    if (live_) {
        action_();
    }
}

void ScopeGuard::dismiss() {
    live_ = false;
}

void with_session(const std::string &name, const std::function<void()> &body) {
    // No try and no catch. The scope ends the same way whether control leaves
    // by return or by exception, and the destructor runs on both roads out.
    Session session(name);
    body();
}

void transact(const std::function<void()> &body) {
    // Arm the undo first, so it is already in place if body throws on its
    // first statement. Success is the case that has to speak up.
    ScopeGuard rollback([] { journal().push_back("rolled back"); });
    body();
    rollback.dismiss();
    journal().push_back("committed");
}
