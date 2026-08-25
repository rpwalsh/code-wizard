// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <cctype>
#include <cstddef>
#include <vector>

namespace {

/** True for one or more digits and nothing else. No sign, no space. */
bool all_digits(const std::string &text) {
    if (text.empty()) {
        return false;
    }
    for (std::size_t index = 0; index < text.size(); index += 1) {
        if (std::isdigit(static_cast<unsigned char>(text[index])) == 0) {
            return false;
        }
    }
    return true;
}

int to_int(const std::string &text) {
    int value = 0;
    for (std::size_t index = 0; index < text.size(); index += 1) {
        value = value * 10 + (text[index] - '0');
    }
    return value;
}

std::vector<std::string> split_on_dots(const std::string &text) {
    std::vector<std::string> parts;
    std::size_t start = 0;
    while (true) {
        const std::size_t dot = text.find('.', start);
        if (dot == std::string::npos) {
            parts.push_back(text.substr(start));
            return parts;
        }
        parts.push_back(text.substr(start, dot - start));
        start = dot + 1;
    }
}

}  // namespace

// Delegating, so the zero version is described in exactly one place. If the
// other constructor ever grows a check, this one inherits it for free.
Version::Version() : Version(0, 0, 0) {
}

// A member initializer list, not assignment in the body. Members are
// constructed before the body runs, so assigning there builds each one and
// then overwrites it.
Version::Version(int major_number, int minor_number, int patch_number)
    : major_(major_number), minor_(minor_number), patch_(patch_number) {
}

Version::Version(const std::string &text) {
    const std::vector<std::string> parts = split_on_dots(text);
    if (parts.size() != 3) {
        throw std::invalid_argument("not a version: " + text);
    }
    for (const std::string &part : parts) {
        if (!all_digits(part)) {
            throw std::invalid_argument("not a version: " + text);
        }
    }

    major_ = to_int(parts[0]);
    minor_ = to_int(parts[1]);
    patch_ = to_int(parts[2]);
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
    return std::to_string(major_) + "." + std::to_string(minor_) + "." +
           std::to_string(patch_);
}

bool Version::is_before(const Version &other) const {
    // Part by part, most significant first, and each part compared as a
    // number. This is exactly where comparing the text instead goes wrong:
    // "1.9.0" sorts after "1.10.0" because '9' is greater than '1'.
    if (major_ != other.major_) {
        return major_ < other.major_;
    }
    if (minor_ != other.minor_) {
        return minor_ < other.minor_;
    }
    return patch_ < other.patch_;
}

bool Version::operator==(const Version &other) const {
    if (major_ != other.major_) {
        return false;
    }
    if (minor_ != other.minor_) {
        return false;
    }
    return patch_ == other.patch_;
}
