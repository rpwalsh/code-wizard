// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <stdexcept>
#include <string>

/** A field the record does not contain at all. */
class MissingField : public std::runtime_error {
  public:
    explicit MissingField(const std::string &field);
    const std::string &field() const;

  private:
    std::string field_;
};

/** A field that is present, and is not a number. */
class BadValue : public std::runtime_error {
  public:
    BadValue(const std::string &field, const std::string &text);
    const std::string &field() const;
    const std::string &text() const;

  private:
    std::string field_;
    std::string text_;
};

/**
 * Reads an integer field out of a record shaped `key=value,key=value`.
 *
 * Throws MissingField when the key is absent and BadValue when it is present
 * but not an integer.
 */
int read_field(const std::string &record, const std::string &field);

/** The same, except a missing field is worth `fallback` rather than a throw. */
int read_field_or(const std::string &record, const std::string &field, int fallback);

/** One line describing what happened, whichever of the three things it was. */
std::string diagnose(const std::string &record, const std::string &field);
