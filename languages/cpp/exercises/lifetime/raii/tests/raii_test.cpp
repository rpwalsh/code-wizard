// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <stdexcept>
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
/** The journal as one line, so a whole sequence fits in one assertion. */
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

RETRAINER_TEST(a_session_journals_both_ends_of_its_life, "cpp.lifetime.raii") {
    clear_journal();
    {
        Session session("alpha");
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "open alpha | close alpha");
}

RETRAINER_TEST(nested_sessions_close_in_reverse_order, "cpp.lifetime.raii") {
    // Destruction is construction backwards. Anything else would let an inner
    // resource outlive the outer one it was borrowed from.
    clear_journal();
    {
        Session outer("outer");
        {
            Session inner("inner");
        }
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "open outer | open inner | close inner | close outer");
}

RETRAINER_TEST(a_guard_runs_its_action_at_scope_exit, "cpp.lifetime.raii") {
    clear_journal();
    {
        ScopeGuard guard([] { journal().push_back("undone"); });
        journal().push_back("working");
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "working | undone");
}

RETRAINER_TEST(a_dismissed_guard_does_nothing, "cpp.lifetime.raii") {
    clear_journal();
    {
        ScopeGuard guard([] { journal().push_back("undone"); });
        journal().push_back("working");
        guard.dismiss();
    }
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "working");
}

RETRAINER_TEST(with_session_closes_after_the_body, "cpp.lifetime.raii") {
    clear_journal();
    with_session("job", [] { journal().push_back("work"); });
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "open job | work | close job");
}

RETRAINER_TEST(a_transaction_that_returns_is_committed, "cpp.errors.guarantees") {
    clear_journal();
    transact([] { journal().push_back("wrote a row"); });
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "wrote a row | committed");
}

RETRAINER_TEST(a_transaction_that_throws_is_rolled_back, "cpp.errors.guarantees") {
    clear_journal();
    bool threw = false;
    try {
        transact([] {
            journal().push_back("wrote a row");
            throw std::runtime_error("the disk went away");
        });
    } catch (const std::runtime_error &) {
        threw = true;
    }
    RETRAINER_ASSERT(threw, "the exception carries on out of transact");
    const std::string line = trail();
    RETRAINER_ASSERT_STR(line.c_str(), "wrote a row | rolled back");
}
