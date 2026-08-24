// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdexcept>
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
std::string trail() {
    std::string joined;
    for (const std::string &entry : journal()) {
        if (!joined.empty()) {
            joined += " | ";
        }
        joined += entry;
    }
    return joined;
}
}  // namespace

RETRAINER_TEST(a_session_closes_while_an_exception_unwinds, "cpp.lifetime.raii") {
    // The whole argument for RAII in one test. Nobody wrote a catch, nobody
    // wrote a close, and the session closed anyway.
    clear_journal();
    try {
        Session session("alpha");
        throw std::runtime_error("boom");
    } catch (const std::runtime_error &) {
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "open alpha | close alpha");
}

RETRAINER_TEST(a_guard_runs_while_an_exception_unwinds, "cpp.lifetime.raii") {
    clear_journal();
    try {
        ScopeGuard guard([] { journal().push_back("undone"); });
        throw std::runtime_error("boom");
    } catch (const std::runtime_error &) {
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "undone");
}

RETRAINER_TEST(a_guard_dismissed_twice_stays_dismissed, "cpp.lifetime.raii") {
    clear_journal();
    {
        ScopeGuard guard([] { journal().push_back("undone"); });
        guard.dismiss();
        guard.dismiss();
    }
    RETRAINER_ASSERT_INT((int)journal().size(), 0);
}

RETRAINER_TEST(a_guard_runs_its_action_exactly_once, "cpp.lifetime.raii") {
    clear_journal();
    {
        ScopeGuard guard([] { journal().push_back("undone"); });
    }
    RETRAINER_ASSERT_INT((int)journal().size(), 1);
}

RETRAINER_TEST(a_dismissed_guard_stays_dismissed_through_a_throw, "cpp.lifetime.raii") {
    // Dismissing means the work succeeded. An exception thrown afterwards, by
    // something else, must not undo work that was already good.
    clear_journal();
    try {
        ScopeGuard guard([] { journal().push_back("undone"); });
        guard.dismiss();
        throw std::runtime_error("something later");
    } catch (const std::runtime_error &) {
    }
    RETRAINER_ASSERT_INT((int)journal().size(), 0);
}

RETRAINER_TEST(the_original_exception_reaches_the_caller_unchanged, "cpp.errors.guarantees") {
    // Rolling back is not the same as handling. Swallowing here would leave
    // the caller believing the work went through.
    clear_journal();
    std::string message;
    try {
        transact([] { throw std::runtime_error("the disk went away"); });
    } catch (const std::exception &error) {
        message = error.what();
    }
    RETRAINER_ASSERT_STR(message.c_str(), "the disk went away");
}

RETRAINER_TEST(a_transaction_that_fails_never_says_committed, "cpp.errors.guarantees") {
    clear_journal();
    try {
        transact([] { throw std::runtime_error("boom"); });
    } catch (const std::runtime_error &) {
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "rolled back");
}

RETRAINER_TEST(an_empty_transaction_commits_and_says_nothing_else, "cpp.errors.guarantees") {
    clear_journal();
    transact([] {});
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "committed");
}

RETRAINER_TEST(sessions_close_before_the_rollback_they_are_inside, "cpp.errors.guarantees") {
    // Unwinding runs destructors from the inside out, so a resource opened
    // during the transaction is already released by the time the undo runs.
    clear_journal();
    try {
        transact([] {
            with_session("job", [] { throw std::runtime_error("boom"); });
        });
    } catch (const std::runtime_error &) {
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "open job | close job | rolled back");
}

RETRAINER_TEST(an_inner_transaction_commits_even_when_the_outer_one_fails, "cpp.errors.guarantees") {
    clear_journal();
    try {
        transact([] {
            transact([] { journal().push_back("inner work"); });
            throw std::runtime_error("boom");
        });
    } catch (const std::runtime_error &) {
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "inner work | committed | rolled back");
}
