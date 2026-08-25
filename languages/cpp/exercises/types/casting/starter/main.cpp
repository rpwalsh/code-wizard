// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

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
    (void)animal;
    return nullptr;
}

bool is_exactly_dog(const Animal &animal) {
    (void)animal;
    return false;
}

int dog_count(const std::vector<std::unique_ptr<Animal>> &animals) {
    (void)animals;
    return 0;
}

int truncate(double value) {
    (void)value;
    return 0;
}

int byte_value(char value) {
    (void)value;
    return 0;
}
