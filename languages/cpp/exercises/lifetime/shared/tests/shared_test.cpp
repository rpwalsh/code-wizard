// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_tree_wires_both_directions, "cpp.lifetime.shared") {
    auto root = make_tree("mother", {"alice", "ben"});
    RETRAINER_ASSERT(root != nullptr, "make_tree returned nothing");
    if (root == nullptr) return;  // a stub returns nullptr; do not follow it
    RETRAINER_ASSERT_INT(static_cast<int>(root->children.size()), 2);
    if (root->children.size() < 2) return;
    RETRAINER_ASSERT_STR(root->children[0]->name.c_str(), "alice");

    const std::string up = parent_name(*root->children[1]);
    RETRAINER_ASSERT_STR(up.c_str(), "mother");
}

RETRAINER_TEST(the_root_has_no_parent, "cpp.lifetime.shared") {
    auto root = make_tree("solo", {});
    RETRAINER_ASSERT(root != nullptr, "make_tree returned nothing");
    if (root == nullptr) return;  // a stub returns nullptr; do not follow it
    const std::string up = parent_name(*root);
    RETRAINER_ASSERT_STR(up.c_str(), "(root)");
}

RETRAINER_TEST(family_size_counts_the_whole_tree, "cpp.lifetime.shared") {
    RETRAINER_ASSERT_INT(family_size(make_tree("r", {"a", "b", "c"})), 4);
    RETRAINER_ASSERT_INT(family_size(make_tree("r", {})), 1);
}

RETRAINER_TEST(names_read_by_reference_and_value, "cpp.lifetime.references") {
    auto root = make_tree("held", {});
    RETRAINER_ASSERT(root != nullptr, "make_tree returned nothing");
    if (root == nullptr) return;  // a stub returns nullptr; do not follow it
    const std::string &ref = name_of(*root);
    RETRAINER_ASSERT_STR(ref.c_str(), "held");
    RETRAINER_ASSERT(&ref == &root->name, "the reference aliases the member, no copy");

    std::string copy = name_copy(*root);
    RETRAINER_ASSERT(&copy != &root->name, "the copy is its own string");
}
