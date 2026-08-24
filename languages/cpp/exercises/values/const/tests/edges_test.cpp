// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_catalog_totals_nothing, "cpp.values.const") {
    const Catalog catalog;
    RETRAINER_ASSERT_INT(catalog.total(), 0);
    RETRAINER_ASSERT_INT((int)catalog.skus().size(), 0);
    RETRAINER_ASSERT_STR(dearest(catalog), "");
}

RETRAINER_TEST(a_failed_lookup_still_counts_as_a_lookup, "cpp.values.const") {
    // Otherwise the counter measures successes and calls itself lookups,
    // which is the kind of metric that quietly answers a different question.
    const Catalog catalog;
    catalog.price("nothing at all");
    RETRAINER_ASSERT_INT(catalog.lookups(), 1);
}

RETRAINER_TEST(the_total_is_recomputed_after_a_change, "cpp.values.const") {
    // The cache is the whole reason `mutable` is here, and a cache that
    // survives a change to what it summarizes is just a wrong answer kept
    // somewhere convenient.
    Catalog catalog;
    catalog.add("bolt", 40);
    RETRAINER_ASSERT_INT(catalog.total(), 40);

    catalog.add("anvil", 60);
    RETRAINER_ASSERT_INT(catalog.total(), 100);
}

RETRAINER_TEST(replacing_a_price_changes_the_total, "cpp.values.const") {
    Catalog catalog;
    catalog.add("bolt", 40);
    RETRAINER_ASSERT_INT(catalog.total(), 40);

    catalog.add("bolt", 90);
    RETRAINER_ASSERT_INT(catalog.total(), 90);
}

RETRAINER_TEST(asking_for_the_total_twice_gives_the_same_answer, "cpp.values.const") {
    Catalog catalog;
    catalog.add("bolt", 40);
    catalog.add("crate", 5);
    RETRAINER_ASSERT_INT(catalog.total(), 45);
    RETRAINER_ASSERT_INT(catalog.total(), 45);
    RETRAINER_ASSERT_INT(catalog.total(), 45);
}

RETRAINER_TEST(the_total_does_not_count_as_a_lookup, "cpp.values.const") {
    Catalog catalog;
    catalog.add("bolt", 40);
    catalog.total();
    catalog.skus();
    RETRAINER_ASSERT_INT(catalog.lookups(), 0);
}

RETRAINER_TEST(a_price_of_zero_is_a_price, "cpp.values.const") {
    // The reason price() returns an optional rather than an int. Zero and
    // absent are different answers, and a function returning 0 for both
    // forces every caller to guess which one it meant.
    Catalog catalog;
    catalog.add("sample", 0);
    const std::optional<int> found = catalog.price("sample");
    RETRAINER_ASSERT(found.has_value(), "a free sample is still stocked");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 0);
}

RETRAINER_TEST(a_lookup_does_not_add_the_sku_it_failed_to_find, "cpp.values.const") {
    // Subscripting a map inserts. If price() reached for operator[] the
    // catalog would grow a zero-priced entry every time somebody asked about
    // something it does not stock.
    Catalog catalog;
    catalog.add("bolt", 40);
    catalog.price("piano");
    catalog.price("piano");
    RETRAINER_ASSERT_INT((int)catalog.skus().size(), 1);
    RETRAINER_ASSERT_INT(catalog.total(), 40);
}

RETRAINER_TEST(a_tie_for_dearest_goes_to_the_first, "cpp.values.const") {
    Catalog catalog;
    catalog.add("anvil", 500);
    catalog.add("bolt", 500);
    RETRAINER_ASSERT_STR(dearest(catalog), "anvil");
}

RETRAINER_TEST(the_dearest_of_one_is_that_one, "cpp.values.const") {
    Catalog catalog;
    catalog.add("lonely", 1);
    RETRAINER_ASSERT_STR(dearest(catalog), "lonely");
}
