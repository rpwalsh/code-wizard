// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <typeinfo>

Animal::~Animal() = default;

std::string Dog::sound() const {
    return "woof";
}

std::string Puppy::sound() const {
    return "yip";
}

std::string Cat::sound() const {
    return "meow";
}

const Dog *as_dog(const Animal &animal) {
    // dynamic_cast asks at run time and answers honestly. On a pointer it
    // returns null for no; on a reference it throws, because there is no null
    // reference to hand back.
    return dynamic_cast<const Dog *>(&animal);
}

bool is_exactly_dog(const Animal &animal) {
    // typeid is the exact type, with no inheritance in the answer. This is
    // the one question dynamic_cast cannot be asked, because a Puppy really
    // is a Dog and dynamic_cast is right to say so.
    return typeid(animal) == typeid(Dog);
}

int dog_count(const std::vector<std::unique_ptr<Animal>> &animals) {
    int found = 0;
    for (const std::unique_ptr<Animal> &animal : animals) {
        if (as_dog(*animal) != nullptr) {
            found += 1;
        }
    }
    return found;
}

int truncate(double value) {
    // static_cast for a conversion the compiler can check. Narrowing toward
    // zero is what this conversion does, in both directions.
    return static_cast<int>(value);
}

int byte_value(char value) {
    // Through unsigned char first, always. Whether a plain char is signed is
    // up to the platform, and casting a negative one straight to int keeps
    // the sign — so a byte of 0xFF becomes -1 rather than 255, and every
    // table lookup indexed by it reads before the start of the array.
    return static_cast<int>(static_cast<unsigned char>(value));
}
