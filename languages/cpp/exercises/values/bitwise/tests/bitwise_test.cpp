// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_permission_can_be_added, "cpp.values.bitwise") {
    const Permission set = with(Permission::none, Permission::read);
    RETRAINER_ASSERT(has(set, Permission::read), "read is in");
    RETRAINER_ASSERT(!has(set, Permission::write), "write is not");
}

RETRAINER_TEST(permissions_accumulate, "cpp.values.bitwise") {
    Permission set = Permission::none;
    set = with(set, Permission::read);
    set = with(set, Permission::write);

    RETRAINER_ASSERT(has(set, Permission::read), "read survived");
    RETRAINER_ASSERT(has(set, Permission::write), "write arrived");
    RETRAINER_ASSERT(!has(set, Permission::execute), "execute never did");
}

RETRAINER_TEST(a_permission_can_be_taken_away, "cpp.values.bitwise") {
    const Permission set = without(Permission::all, Permission::write);
    RETRAINER_ASSERT(has(set, Permission::read), "read stayed");
    RETRAINER_ASSERT(!has(set, Permission::write), "write went");
    RETRAINER_ASSERT(has(set, Permission::execute), "execute stayed");
}

RETRAINER_TEST(having_all_of_something_is_not_having_any_of_it, "cpp.values.bitwise") {
    // The distinction that matters. With read only, the set has *some* of
    // read-and-write and not *all* of it.
    const Permission set = with(Permission::none, Permission::read);
    const Permission both = with(Permission::read, Permission::write);

    RETRAINER_ASSERT(!has(set, both), "not all of read and write");
    RETRAINER_ASSERT(has_any(set, both), "but some of it");
}

RETRAINER_TEST(a_set_describes_itself, "cpp.values.bitwise") {
    RETRAINER_ASSERT_STR(describe(Permission::all), "rwx");
    RETRAINER_ASSERT_STR(describe(Permission::none), "---");
    RETRAINER_ASSERT_STR(describe(with(Permission::read, Permission::execute)), "r-x");
}

RETRAINER_TEST(permissions_are_counted, "cpp.values.bitwise") {
    RETRAINER_ASSERT_INT(count(Permission::all), 3);
    RETRAINER_ASSERT_INT(count(Permission::none), 0);
    RETRAINER_ASSERT_INT(count(with(Permission::read, Permission::write)), 2);
}
