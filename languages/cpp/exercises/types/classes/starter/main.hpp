// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <stdexcept>
#include <string>

/**
 * A three-part version number.
 *
 * The accessors are spelled out rather than named major/minor because those
 * two are macros in some system headers, and a name that compiles everywhere
 * except on one build machine is a name not worth defending.
 */
class Version {
  public:
    /** 0.0.0. Delegates to the constructor below rather than repeating it. */
    Version();

    Version(int major_number, int minor_number, int patch_number);

    /** Parses "1.2.3". Throws std::invalid_argument on anything else. */
    explicit Version(const std::string &text);

    int major_number() const;
    int minor_number() const;
    int patch_number() const;

    /** "1.2.3". */
    std::string text() const;

    /** Whether this version came before the other one. */
    bool is_before(const Version &other) const;

    bool operator==(const Version &other) const;

  private:
    int major_ = 0;
    int minor_ = 0;
    int patch_ = 0;
};
