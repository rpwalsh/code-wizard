// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_empty_registry_has_no_entries, "cpp.lifetime.raii") {
    Registry registry;
    RETRAINER_ASSERT_INT(registry.size(), 0);
    RETRAINER_ASSERT(registry.find("anything") == nullptr, "expected nullptr");
}

RETRAINER_TEST(taking_something_absent_is_null, "cpp.values.move") {
    Registry registry;
    registry.add("alpha", 1);
    RETRAINER_ASSERT(registry.take("nope") == nullptr, "expected nullptr");
    RETRAINER_ASSERT_INT(registry.size(), 1);
}

RETRAINER_TEST(duplicate_names_keep_the_first_found, "cpp.lifetime.unique") {
    Registry registry;
    registry.add("same", 1);
    registry.add("same", 2);
    RETRAINER_ASSERT_INT(registry.find("same")->value, 1);
    RETRAINER_ASSERT_INT(registry.size(), 2);
}

RETRAINER_TEST(taking_removes_only_one, "cpp.values.move") {
    Registry registry;
    registry.add("same", 1);
    registry.add("same", 2);

    auto owned = registry.take("same");
    RETRAINER_ASSERT_INT(owned->value, 1);
    RETRAINER_ASSERT_INT(registry.size(), 1);
    RETRAINER_ASSERT_INT(registry.find("same")->value, 2);
}

RETRAINER_TEST(entries_survive_being_taken_out_of_scope, "cpp.lifetime.raii") {
    std::unique_ptr<Entry> owned;
    {
        Registry registry;
        registry.add("alpha", 42);
        owned = registry.take("alpha");
    }
    // The registry is gone; the entry is not, because ownership moved.
    RETRAINER_ASSERT(owned != nullptr, "the entry did not survive");
    RETRAINER_ASSERT_INT(owned->value, 42);
}
