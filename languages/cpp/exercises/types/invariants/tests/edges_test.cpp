// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(emptied_items_leave_the_map, "cpp.types.classes") {
    Inventory inv;
    inv.add("bolt", 5);
    RETRAINER_ASSERT(inv.remove("bolt", 5), "exact removal should work");

    // The invariant at work: no ghost at zero.
    RETRAINER_ASSERT_INT(inv.distinct(), 0);
    RETRAINER_ASSERT_INT(inv.count("bolt"), 0);
    RETRAINER_ASSERT(!inv.remove("bolt", 1), "nothing left to remove");
}

RETRAINER_TEST(nonpositive_counts_are_ignored, "cpp.types.classes") {
    Inventory inv;
    inv.add("bolt", 0);
    inv.add("bolt", -5);
    RETRAINER_ASSERT_INT(inv.distinct(), 0);
    RETRAINER_ASSERT(!inv.remove("bolt", 0), "removing zero is refused");
}

RETRAINER_TEST(querying_never_creates, "cpp.values.const") {
    Inventory inv;
    inv.add("real", 1);
    // A count() built on operator[] would insert "phantom" at 0 here —
    // and the compiler already refused that in a const method.
    (void)inv.count("phantom");
    RETRAINER_ASSERT_INT(inv.distinct(), 1);
}

RETRAINER_TEST(the_rule_of_zero_copy_just_works, "cpp.lifetime.rule") {
    Inventory original;
    original.add("bolt", 5);

    Inventory copy = original;
    copy.add("bolt", 10);
    RETRAINER_ASSERT(original.remove("bolt", 5), "original still has its 5");

    // Independent: no destructor, no copy constructor written, and the
    // member-managed map still deep-copied correctly.
    RETRAINER_ASSERT_INT(copy.count("bolt"), 15);
    RETRAINER_ASSERT_INT(original.count("bolt"), 0);
}
