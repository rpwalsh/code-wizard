// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

namespace {
Catalog stocked() {
    Catalog catalog;
    catalog.add("bolt", 40);
    catalog.add("anvil", 1250);
    catalog.add("crate", 300);
    return catalog;
}
}  // namespace

RETRAINER_TEST(a_price_comes_back_out, "cpp.values.const") {
    const Catalog catalog = stocked();
    const std::optional<int> found = catalog.price("anvil");
    RETRAINER_ASSERT(found.has_value(), "the anvil has a price");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 1250);
}

RETRAINER_TEST(a_missing_sku_has_no_price, "cpp.values.const") {
    const Catalog catalog = stocked();
    RETRAINER_ASSERT(!catalog.price("piano").has_value(), "nothing is not zero");
}

RETRAINER_TEST(adding_the_same_sku_twice_replaces_the_price, "cpp.values.const") {
    Catalog catalog;
    catalog.add("bolt", 40);
    catalog.add("bolt", 45);
    const std::optional<int> found = catalog.price("bolt");
    RETRAINER_ASSERT(found.has_value(), "the bolt still has a price");
    if (!found.has_value()) return;
    RETRAINER_ASSERT_INT(found.value(), 45);
}

RETRAINER_TEST(lookups_are_counted_even_though_looking_changes_nothing, "cpp.values.const") {
    // price() is const and still increments the counter, because the counter
    // is not part of what a caller can observe about the catalog's value.
    const Catalog catalog = stocked();
    RETRAINER_ASSERT_INT(catalog.lookups(), 0);
    catalog.price("bolt");
    catalog.price("piano");
    RETRAINER_ASSERT_INT(catalog.lookups(), 2);
}

RETRAINER_TEST(the_total_adds_every_price, "cpp.values.const") {
    const Catalog catalog = stocked();
    RETRAINER_ASSERT_INT(catalog.total(), 40 + 1250 + 300);
}

RETRAINER_TEST(the_skus_come_back_in_order, "cpp.values.const") {
    const Catalog catalog = stocked();
    const std::vector<std::string> names = catalog.skus();
    RETRAINER_ASSERT_INT((int)names.size(), 3);
    if (names.size() < 3) return;
    RETRAINER_ASSERT_STR(names[0], "anvil");
    RETRAINER_ASSERT_STR(names[1], "bolt");
    RETRAINER_ASSERT_STR(names[2], "crate");
}

RETRAINER_TEST(the_dearest_sku_is_found_through_a_const_reference, "cpp.values.const") {
    const Catalog catalog = stocked();
    RETRAINER_ASSERT_STR(dearest(catalog), "anvil");
}
