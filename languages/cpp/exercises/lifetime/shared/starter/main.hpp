// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <memory>
#include <string>
#include <vector>

struct Node {
    std::string name;
    std::vector<std::shared_ptr<Node>> children;
    std::weak_ptr<Node> parent;
};

std::shared_ptr<Node> make_tree(const std::string &root_name,
                                const std::vector<std::string> &child_names);

std::string parent_name(const Node &node);

int family_size(const std::shared_ptr<Node> &root);

const std::string &name_of(const Node &node);

std::string name_copy(const Node &node);

#endif /* MAIN_HPP */
