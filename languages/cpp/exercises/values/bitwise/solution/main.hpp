// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <string>

/**
 * Permissions as a set of bits, with the underlying type spelled out.
 *
 * Naming the type matters here: the values are combined and shifted, and
 * leaving the compiler to pick the width means the answer could differ
 * between builds. It is a scoped enum, so none of this happens implicitly.
 */
enum class Permission : unsigned {
    none = 0,
    read = 1,
    write = 2,
    execute = 4,
    all = 7,
};

/** The set with every bit of `flag` added. */
Permission with(Permission set, Permission flag);

/** The set with every bit of `flag` removed. */
Permission without(Permission set, Permission flag);

/** Whether **every** bit of `flag` is present. */
bool has(Permission set, Permission flag);

/** Whether **any** bit of `flag` is present. */
bool has_any(Permission set, Permission flag);

/** "rwx", with a dash in place of each permission that is missing. */
std::string describe(Permission set);

/** How many of the three permissions are set. */
int count(Permission set);
