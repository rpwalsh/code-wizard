// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

Permission with(Permission set, Permission flag) {
    (void)flag;
    return set;
}

Permission without(Permission set, Permission flag) {
    (void)flag;
    return set;
}

bool has(Permission set, Permission flag) {
    (void)set;
    (void)flag;
    return false;
}

bool has_any(Permission set, Permission flag) {
    (void)set;
    (void)flag;
    return false;
}

std::string describe(Permission set) {
    (void)set;
    return "";
}

int count(Permission set) {
    (void)set;
    return 0;
}
