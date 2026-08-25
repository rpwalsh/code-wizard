// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(adds_and_counts, "cpp.types.classes") {
    Inventory inv;
    inv.add("bolt", 10);
    inv.add("bolt", 5);
    inv.add("nut", 3);

    RETRAINER_ASSERT_INT(inv.count("bolt"), 15);
    RETRAINER_ASSERT_INT(inv.count("nut"), 3);
    RETRAINER_ASSERT_INT(inv.total(), 18);
    RETRAINER_ASSERT_INT(inv.distinct(), 2);
}

RETRAINER_TEST(removal_respects_the_stock, "cpp.types.classes") {
    Inventory inv;
    inv.add("bolt", 10);

    RETRAINER_ASSERT(inv.remove("bolt", 4), "removing 4 of 10 should work");
    RETRAINER_ASSERT_INT(inv.count("bolt"), 6);

    RETRAINER_ASSERT(!inv.remove("bolt", 7), "removing 7 of 6 must refuse");
    RETRAINER_ASSERT_INT(inv.count("bolt"), 6);
}

RETRAINER_TEST(absent_items_count_zero, "cpp.values.const") {
    const Inventory inv;
    RETRAINER_ASSERT_INT(inv.count("phantom"), 0);
    RETRAINER_ASSERT_INT(inv.total(), 0);
    RETRAINER_ASSERT_INT(inv.distinct(), 0);
}

RETRAINER_TEST(names_come_back_sorted, "cpp.types.classes") {
    Inventory inv;
    inv.add("washer", 1);
    inv.add("bolt", 1);
    inv.add("nut", 1);

    auto names = inv.names_sorted();
    RETRAINER_ASSERT_INT(static_cast<int>(names.size()), 3);
    if (names.size() < 3) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT_STR(names[0].c_str(), "bolt");
    RETRAINER_ASSERT_STR(names[2].c_str(), "washer");
}
