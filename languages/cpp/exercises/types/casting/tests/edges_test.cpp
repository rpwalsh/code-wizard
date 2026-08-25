// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <memory>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(truncating_a_negative_goes_toward_zero_not_down,
               "cpp.types.casting") {
    // Not floor. -2.9 becomes -2, which surprises people who expect rounding
    // down, and is exactly why a cast is not a substitute for std::floor.
    RETRAINER_ASSERT_INT(truncate(-2.9), -2);
    RETRAINER_ASSERT_INT(truncate(-2.1), -2);
    RETRAINER_ASSERT_INT(truncate(-0.5), 0);
}

RETRAINER_TEST(a_value_already_whole_is_unchanged, "cpp.types.casting") {
    RETRAINER_ASSERT_INT(truncate(7.0), 7);
    RETRAINER_ASSERT_INT(truncate(-7.0), -7);
}

RETRAINER_TEST(the_top_half_of_the_byte_range_stays_positive,
               "cpp.types.casting") {
    // Where a plain char cast goes wrong. On a platform with signed char,
    // 0x80 is -128, and casting straight to int keeps the sign — so any
    // table indexed by the result reads before the start of the array.
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(0x80)), 128);
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(0xC3)), 195);
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(0xFE)), 254);
}

RETRAINER_TEST(the_bottom_of_the_byte_range_is_ordinary, "cpp.types.casting") {
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(0)), 0);
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(1)), 1);
    RETRAINER_ASSERT_INT(byte_value(static_cast<char>(0x7F)), 127);
}

RETRAINER_TEST(every_byte_value_lands_in_range, "cpp.types.casting") {
    for (int raw = 0; raw < 256; raw += 1) {
        const int value = byte_value(static_cast<char>(raw));
        RETRAINER_ASSERT(value >= 0, "never negative");
        RETRAINER_ASSERT(value < 256, "and never past the end");
        RETRAINER_ASSERT_INT(value, raw);
    }
}

RETRAINER_TEST(a_cat_is_not_exactly_a_dog_either, "cpp.types.casting") {
    const Cat cat;
    RETRAINER_ASSERT(!is_exactly_dog(cat), "not even close");
}

RETRAINER_TEST(the_pointer_returned_points_at_the_animal_itself,
               "cpp.types.casting") {
    const Dog dog;
    const Dog *found = as_dog(dog);
    RETRAINER_ASSERT(found != nullptr, "the cast succeeded");
    if (found == nullptr) return;
    RETRAINER_ASSERT(found == &dog, "and it is that dog, not a copy");
}

RETRAINER_TEST(a_dog_seen_through_a_base_reference_still_barks,
               "cpp.types.casting") {
    // The cast is not what makes the call work — the virtual function does
    // that. dynamic_cast is for reaching what the base does not declare.
    const Puppy puppy;
    const Animal &animal = puppy;
    RETRAINER_ASSERT_STR(animal.sound(), "yip");

    const Dog *as_a_dog = as_dog(animal);
    RETRAINER_ASSERT(as_a_dog != nullptr, "still a dog");
    if (as_a_dog == nullptr) return;
    RETRAINER_ASSERT_STR(as_a_dog->sound(), "yip");
}

RETRAINER_TEST(counting_no_animals_counts_no_dogs, "cpp.types.casting") {
    RETRAINER_ASSERT_INT(dog_count({}), 0);
}

RETRAINER_TEST(counting_only_cats_counts_no_dogs, "cpp.types.casting") {
    std::vector<std::unique_ptr<Animal>> animals;
    animals.push_back(std::make_unique<Cat>());
    animals.push_back(std::make_unique<Cat>());
    RETRAINER_ASSERT_INT(dog_count(animals), 0);
}

RETRAINER_TEST(counting_only_puppies_counts_them_all, "cpp.types.casting") {
    std::vector<std::unique_ptr<Animal>> animals;
    animals.push_back(std::make_unique<Puppy>());
    animals.push_back(std::make_unique<Puppy>());
    animals.push_back(std::make_unique<Puppy>());
    RETRAINER_ASSERT_INT(dog_count(animals), 3);
}
