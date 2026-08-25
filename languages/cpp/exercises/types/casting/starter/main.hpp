// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <memory>
#include <string>
#include <vector>

struct Animal {
    virtual ~Animal();
    virtual std::string sound() const = 0;
};

struct Dog : Animal {
    std::string sound() const override;
};

/** A Dog, and therefore anything that accepts a Dog accepts one of these. */
struct Puppy : Dog {
    std::string sound() const override;
};

struct Cat : Animal {
    std::string sound() const override;
};

/** The animal seen as a Dog, or nullptr when it is not one at all. */
const Dog *as_dog(const Animal &animal);

/** Whether the animal is a Dog and **not** something derived from one. */
bool is_exactly_dog(const Animal &animal);

/** How many of these are dogs. A puppy is a dog. */
int dog_count(const std::vector<std::unique_ptr<Animal>> &animals);

/** The value with its fractional part dropped, toward zero in both directions. */
int truncate(double value);

/**
 * The character's numeric value, always 0 to 255.
 *
 * Whether a plain `char` is signed is up to the platform, and this must give
 * the same answer either way.
 */
int byte_value(char value);
