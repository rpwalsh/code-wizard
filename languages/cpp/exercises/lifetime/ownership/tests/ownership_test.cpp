// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(stores_and_finds, "cpp.lifetime.unique") {
    Registry registry;
    registry.add("alpha", 1);
    registry.add("beta", 2);

    const Entry *found = registry.find("beta");
    RETRAINER_ASSERT(found != nullptr, "find returned nullptr");
    if (found == nullptr) return;  // a stub returns nullptr; do not follow it
    RETRAINER_ASSERT_INT(found->value, 2);
    RETRAINER_ASSERT_INT(registry.size(), 2);
}

RETRAINER_TEST(missing_names_are_null, "cpp.lifetime.unique") {
    Registry registry;
    registry.add("alpha", 1);
    RETRAINER_ASSERT(registry.find("nope") == nullptr, "expected nullptr");
}

RETRAINER_TEST(take_transfers_ownership, "cpp.values.move") {
    Registry registry;
    registry.add("alpha", 1);

    auto owned = registry.take("alpha");
    RETRAINER_ASSERT(owned != nullptr, "take returned nullptr");
    if (owned == nullptr) return;
    RETRAINER_ASSERT_INT(owned->value, 1);
    // Gone from the registry: exactly one owner, and it is now the caller.
    RETRAINER_ASSERT_INT(registry.size(), 0);
    RETRAINER_ASSERT(registry.find("alpha") == nullptr, "entry survived take");
}
