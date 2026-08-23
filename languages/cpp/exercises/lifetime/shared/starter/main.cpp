// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

std::shared_ptr<Node> make_tree(const std::string &root_name,
                                const std::vector<std::string> &child_names) {
    (void)root_name;
    (void)child_names;
    return nullptr;
}

std::string parent_name(const Node &node) {
    (void)node;
    return "";
}

int family_size(const std::shared_ptr<Node> &root) {
    (void)root;
    return -1;
}

static std::string never_used;

const std::string &name_of(const Node &node) {
    (void)node;
    return never_used;
}

std::string name_copy(const Node &node) {
    (void)node;
    return "";
}
