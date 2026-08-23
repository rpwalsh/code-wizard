// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::shared_ptr<Node> make_tree(const std::string &root_name,
                                const std::vector<std::string> &child_names) {
    auto root = std::make_shared<Node>();
    root->name = root_name;

    for (const auto &child_name : child_names) {
        auto child = std::make_shared<Node>();
        child->name = child_name;
        child->parent = root;
        root->children.push_back(child);
    }
    return root;
}

std::string parent_name(const Node &node) {
    // lock() is the whole weak_ptr philosophy: you may not use the target
    // directly, only ask for a checked, temporary shared_ptr.
    auto held = node.parent.lock();
    return held ? held->name : "(root)";
}

int family_size(const std::shared_ptr<Node> &root) {
    if (!root) {
        return 0;
    }
    int size = 1;
    for (const auto &child : root->children) {
        size += family_size(child);
    }
    return size;
}

const std::string &name_of(const Node &node) {
    // Safe because the caller holds the Node: the reference cannot
    // outlive what they already own.
    return node.name;
}

std::string name_copy(const Node &node) {
    return node.name;
}
