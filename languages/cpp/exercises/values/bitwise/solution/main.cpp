// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

namespace {

/**
 * The casts live here and nowhere else.
 *
 * A scoped enum does not convert to its underlying type on its own, which is
 * exactly the protection wanted — and it means the bit work needs a way in.
 * Two small functions keep every cast in one place instead of scattering
 * static_cast through the file.
 */
unsigned bits(Permission set) {
    return static_cast<unsigned>(set);
}

Permission from_bits(unsigned value) {
    return static_cast<Permission>(value);
}

}  // namespace

Permission with(Permission set, Permission flag) {
    return from_bits(bits(set) | bits(flag));
}

Permission without(Permission set, Permission flag) {
    // AND with the complement: keep every bit except the ones named.
    return from_bits(bits(set) & ~bits(flag));
}

bool has(Permission set, Permission flag) {
    // Every bit of flag. Comparing against zero instead would answer "any",
    // and the two agree on single flags and disagree on combinations — so
    // the mistake survives every test written with one permission at a time.
    return (bits(set) & bits(flag)) == bits(flag);
}

bool has_any(Permission set, Permission flag) {
    return (bits(set) & bits(flag)) != 0;
}

std::string describe(Permission set) {
    std::string out;
    out += has(set, Permission::read) ? 'r' : '-';
    out += has(set, Permission::write) ? 'w' : '-';
    out += has(set, Permission::execute) ? 'x' : '-';
    return out;
}

int count(Permission set) {
    int found = 0;
    const Permission each[] = {Permission::read, Permission::write, Permission::execute};
    for (const Permission flag : each) {
        if (has(set, flag)) {
            found += 1;
        }
    }
    return found;
}
