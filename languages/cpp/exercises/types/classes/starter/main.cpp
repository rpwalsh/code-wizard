// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

Version::Version() {
}

Version::Version(int major_number, int minor_number, int patch_number) {
    (void)major_number;
    (void)minor_number;
    (void)patch_number;
}

Version::Version(const std::string &text) {
    (void)text;
}

int Version::major_number() const {
    return major_;
}

int Version::minor_number() const {
    return minor_;
}

int Version::patch_number() const {
    return patch_;
}

std::string Version::text() const {
    return "";
}

bool Version::is_before(const Version &other) const {
    (void)other;
    return false;
}

bool Version::operator==(const Version &other) const {
    (void)other;
    return false;
}
