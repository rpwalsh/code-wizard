// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(children_do_not_keep_parents_alive, "cpp.lifetime.shared") {
    std::shared_ptr<Node> kept_child;
    {
        auto root = make_tree("temporary", {"orphan"});
        RETRAINER_ASSERT(root != nullptr, "make_tree returned nothing");
        if (root == nullptr) return;  // a stub returns nullptr; do not follow it
        RETRAINER_ASSERT_INT(static_cast<int>(root->children.size()), 1);
        if (root->children.empty()) return;
        kept_child = root->children[0];
        // root's use_count here: 1 (ours). If the child held a strong
        // back edge it would be 2, and the parent would leak below.
        RETRAINER_ASSERT_INT(static_cast<int>(root.use_count()), 1);
    }
    // The parent died with its scope — the weak edge did not save it,
    // which is precisely the point.
    RETRAINER_ASSERT(kept_child != nullptr, "the child outlived its parent");
    if (kept_child == nullptr) return;
    const std::string up = parent_name(*kept_child);
    RETRAINER_ASSERT_STR(up.c_str(), "(root)");
}

RETRAINER_TEST(sharing_is_counted, "cpp.lifetime.shared") {
    auto root = make_tree("counted", {"a"});
    RETRAINER_ASSERT(root != nullptr, "make_tree returned nothing");
    if (root == nullptr) return;  // a stub returns nullptr; do not follow it
    RETRAINER_ASSERT_INT(static_cast<int>(root.use_count()), 1);
    {
        auto second = root;
        RETRAINER_ASSERT_INT(static_cast<int>(root.use_count()), 2);
    }
    RETRAINER_ASSERT_INT(static_cast<int>(root.use_count()), 1);
}

RETRAINER_TEST(an_empty_root_pointer_is_zero_family, "cpp.lifetime.shared") {
    RETRAINER_ASSERT_INT(family_size(nullptr), 0);
}

RETRAINER_TEST(the_reference_tracks_mutation_the_copy_does_not, "cpp.lifetime.references") {
    auto root = make_tree("before", {});
    RETRAINER_ASSERT(root != nullptr, "make_tree returned nothing");
    if (root == nullptr) return;  // a stub returns nullptr; do not follow it
    const std::string &ref = name_of(*root);
    std::string copy = name_copy(*root);

    root->name = "after";
    RETRAINER_ASSERT_STR(ref.c_str(), "after");
    RETRAINER_ASSERT_STR(copy.c_str(), "before");
}
