// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

namespace {
// The four characters that count as whitespace here, as a view so the
// standard library's own search can do the looking.
constexpr std::string_view kSpace = " \t\n\r";
}  // namespace

std::string_view trimmed(std::string_view text) {
    const std::size_t first = text.find_first_not_of(kSpace);
    if (first == std::string_view::npos) {
        // Nothing but whitespace. Take an empty slice off the far end so the
        // result still points inside the caller's buffer rather than nowhere.
        return text.substr(text.size());
    }

    // remove_prefix and remove_suffix move the view's own ends. Nothing is
    // copied and nothing in the original buffer is touched.
    text.remove_prefix(first);
    text.remove_suffix(text.size() - text.find_last_not_of(kSpace) - 1);
    return text;
}

std::vector<std::string_view> split(std::string_view text, char separator) {
    std::vector<std::string_view> parts;
    if (text.empty()) {
        return parts;
    }

    std::size_t start = 0;
    while (true) {
        const std::size_t found = text.find(separator, start);
        if (found == std::string_view::npos) {
            // The tail, including an empty one when the text ends on a
            // separator: "a," is two fields, the second of them empty.
            parts.push_back(text.substr(start));
            return parts;
        }
        parts.push_back(text.substr(start, found - start));
        start = found + 1;
    }
}

std::string join(const std::vector<std::string_view> &parts, char separator) {
    // Returns a string rather than a view, because the result is new text.
    // A view of it would point at a temporary that dies on the way out.
    std::string out;
    for (std::size_t index = 0; index < parts.size(); index += 1) {
        if (index > 0) {
            out.push_back(separator);
        }
        out.append(parts[index]);
    }
    return out;
}

bool starts_with_any(std::string_view text, const std::vector<std::string_view> &prefixes) {
    for (const std::string_view prefix : prefixes) {
        if (text.starts_with(prefix)) {
            return true;
        }
    }
    return false;
}
