// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <string>
#include <string_view>
#include <vector>

std::string_view trimmed(std::string_view text);
std::vector<std::string_view> split(std::string_view text, char separator);
std::string join(const std::vector<std::string_view> &parts, char separator);
bool starts_with_any(std::string_view text, const std::vector<std::string_view> &prefixes);

#endif
