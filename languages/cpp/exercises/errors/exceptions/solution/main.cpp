// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <cctype>
#include <cstddef>

namespace {

/** True for an optional minus followed by at least one digit, and nothing else. */
bool is_integer(const std::string &text) {
    if (text.empty()) {
        return false;
    }

    std::size_t start = 0;
    if (text[0] == '-') {
        start = 1;
    }
    if (start == text.size()) {
        return false;  // a lone minus sign
    }

    for (std::size_t index = start; index < text.size(); index += 1) {
        if (std::isdigit(static_cast<unsigned char>(text[index])) == 0) {
            return false;
        }
    }
    return true;
}

int to_int(const std::string &text) {
    int value = 0;
    std::size_t start = 0;
    if (text[0] == '-') {
        start = 1;
    }
    for (std::size_t index = start; index < text.size(); index += 1) {
        value = value * 10 + (text[index] - '0');
    }
    if (text[0] == '-') {
        return -value;
    }
    return value;
}

}  // namespace

// The message is built for the base class, which is the part any generic
// handler will see through what(). The typed accessors below are for handlers
// that know which failure they are dealing with and want the pieces back.
MissingField::MissingField(const std::string &field)
    : std::runtime_error("missing field: " + field), field_(field) {
}

const std::string &MissingField::field() const {
    return field_;
}

BadValue::BadValue(const std::string &field, const std::string &text)
    : std::runtime_error("bad value for " + field + ": " + text),
      field_(field),
      text_(text) {
}

const std::string &BadValue::field() const {
    return field_;
}

const std::string &BadValue::text() const {
    return text_;
}

int read_field(const std::string &record, const std::string &field) {
    std::size_t start = 0;
    while (start <= record.size()) {
        std::size_t comma = record.find(',', start);
        if (comma == std::string::npos) {
            comma = record.size();
        }

        const std::string entry = record.substr(start, comma - start);
        const std::size_t equals = entry.find('=');
        if (equals != std::string::npos) {
            const std::string key = entry.substr(0, equals);
            if (key == field) {
                const std::string value = entry.substr(equals + 1);
                if (!is_integer(value)) {
                    throw BadValue(field, value);
                }
                return to_int(value);
            }
        }

        start = comma + 1;
    }

    throw MissingField(field);
}

int read_field_or(const std::string &record, const std::string &field, int fallback) {
    try {
        return read_field(record, field);
    } catch (const MissingField &) {
        // Absent is a question this function has an answer for. Unreadable is
        // not, so BadValue is left alone and carries on to the caller.
        return fallback;
    }
}

std::string diagnose(const std::string &record, const std::string &field) {
    try {
        return "ok: " + std::to_string(read_field(record, field));
    } catch (const BadValue &error) {
        return "bad " + error.field() + ": " + error.text();
    } catch (const MissingField &error) {
        return "missing " + error.field();
    } catch (const std::exception &error) {
        // Last, because a handler for a base class catches every derived one
        // and the first matching handler wins. Put this first and the two
        // above it become unreachable code the compiler will not warn about.
        return std::string("unexpected: ") + error.what();
    }
}
