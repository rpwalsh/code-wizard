// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <memory>
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_dog_is_recognized_as_a_dog, "cpp.types.casting") {
    const Dog dog;
    RETRAINER_ASSERT(as_dog(dog) != nullptr, "a dog is a dog");
}

RETRAINER_TEST(a_cat_is_not_a_dog, "cpp.types.casting") {
    const Cat cat;
    RETRAINER_ASSERT(as_dog(cat) == nullptr, "no it is not");
}

RETRAINER_TEST(a_puppy_is_a_dog, "cpp.types.casting") {
    // dynamic_cast answers about the inheritance, not about the exact class.
    // A puppy passes every test a dog passes, which is what deriving means.
    const Puppy puppy;
    RETRAINER_ASSERT(as_dog(puppy) != nullptr, "a puppy is a dog");
}

RETRAINER_TEST(a_puppy_is_not_exactly_a_dog, "cpp.types.casting") {
    const Puppy puppy;
    const Dog dog;
    RETRAINER_ASSERT(!is_exactly_dog(puppy), "it is a puppy");
    RETRAINER_ASSERT(is_exactly_dog(dog), "and this one is exactly a dog");
}

RETRAINER_TEST(dogs_are_counted_among_animals, "cpp.types.casting") {
    std::vector<std::unique_ptr<Animal>> animals;
    animals.push_back(std::make_unique<Dog>());
    animals.push_back(std::make_unique<Cat>());
    animals.push_back(std::make_unique<Puppy>());

    RETRAINER_ASSERT_INT(dog_count(animals), 2);
}

RETRAINER_TEST(truncating_drops_the_fraction, "cpp.types.casting") {
    RETRAINER_ASSERT_INT(truncate(2.9), 2);
    RETRAINER_ASSERT_INT(truncate(2.1), 2);
    RETRAINER_ASSERT_INT(truncate(0.0), 0);
}

RETRAINER_TEST(a_byte_is_never_negative, "cpp.types.casting") {
    RETRAINER_ASSERT_INT(byte_value('A'), 65);
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(0xFF)), 255);
}
