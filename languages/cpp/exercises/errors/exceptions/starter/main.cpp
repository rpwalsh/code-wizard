// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

MissingField::MissingField(const std::string &field)
    : std::runtime_error(""), field_(field) {
}

const std::string &MissingField::field() const {
    return field_;
}

BadValue::BadValue(const std::string &field, const std::string &text)
    : std::runtime_error(""), field_(field), text_(text) {
}

const std::string &BadValue::field() const {
    return field_;
}

const std::string &BadValue::text() const {
    return text_;
}

int read_field(const std::string &record, const std::string &field) {
    (void)record;
    (void)field;
    return 0;
}

int read_field_or(const std::string &record, const std::string &field, int fallback) {
    (void)record;
    (void)field;
    return fallback;
}

std::string diagnose(const std::string &record, const std::string &field) {
    (void)record;
    (void)field;
    return "";
}
