// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <functional>
#include <string>
#include <vector>

/**
 * The journal every resource in this exercise writes to.
 *
 * Provided for you, and the only way to see any of this work: a destructor
 * returns nothing, takes nothing, and cannot be called on purpose, so
 * watching one run means watching what it leaves behind.
 */
std::vector<std::string> &journal();
void clear_journal();

/** Journals "open <name>" when it is created and "close <name>" when it dies. */
class Session {
  public:
    explicit Session(std::string name);
    ~Session();

    Session(const Session &) = delete;
    Session &operator=(const Session &) = delete;

  private:
    std::string name_;
};

/** Runs an action when it goes out of scope, unless it has been dismissed. */
class ScopeGuard {
  public:
    explicit ScopeGuard(std::function<void()> action);
    ~ScopeGuard();

    void dismiss();

    ScopeGuard(const ScopeGuard &) = delete;
    ScopeGuard &operator=(const ScopeGuard &) = delete;

  private:
    std::function<void()> action_;
    bool live_;
};

/** Runs body inside a session named `name`, which closes either way. */
void with_session(const std::string &name, const std::function<void()> &body);

/** Runs body, journaling "committed" if it returns and "rolled back" if not. */
void transact(const std::function<void()> &body);
