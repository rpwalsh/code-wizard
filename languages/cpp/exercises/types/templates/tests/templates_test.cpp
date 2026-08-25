// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_buffer_holds_what_fits, "cpp.types.templates") {
    RingBuffer<int, 4> window;
    window.push(1);
    window.push(2);
    window.push(3);

    RETRAINER_ASSERT_INT((int)window.size(), 3);
    RETRAINER_ASSERT(!window.full(), "three of four is not full");
    RETRAINER_ASSERT_INT(window.oldest(), 1);
    RETRAINER_ASSERT_INT((int)window.dropped(), 0);
}

RETRAINER_TEST(a_full_buffer_pushes_the_oldest_out, "cpp.types.templates") {
    RingBuffer<int, 3> window;
    for (int value = 1; value <= 5; value += 1) {
        window.push(value);
    }

    RETRAINER_ASSERT_INT((int)window.size(), 3);
    RETRAINER_ASSERT(window.full(), "three of three is full");
    RETRAINER_ASSERT_INT(window.oldest(), 3);
    RETRAINER_ASSERT_INT((int)window.dropped(), 2);
}

RETRAINER_TEST(draining_gives_the_values_oldest_first, "cpp.types.templates") {
    RingBuffer<int, 3> window;
    window.push(10);
    window.push(20);
    window.push(30);
    window.push(40);

    const std::vector<int> held = window.drain();
    RETRAINER_ASSERT_INT((int)held.size(), 3);
    if (held.size() < 3) return;
    RETRAINER_ASSERT_INT(held[0], 20);
    RETRAINER_ASSERT_INT(held[1], 30);
    RETRAINER_ASSERT_INT(held[2], 40);
}

RETRAINER_TEST(draining_leaves_the_buffer_empty, "cpp.types.templates") {
    RingBuffer<int, 2> window;
    window.push(1);
    window.push(2);
    window.drain();

    RETRAINER_ASSERT_INT((int)window.size(), 0);
    RETRAINER_ASSERT(!window.full(), "an emptied buffer is not full");
}

RETRAINER_TEST(a_buffer_works_for_types_that_are_not_numbers, "cpp.types.templates") {
    RingBuffer<std::string, 2> window;
    window.push("alpha");
    window.push("beta");
    window.push("gamma");

    RETRAINER_ASSERT_STR(window.oldest(), "beta");
    RETRAINER_ASSERT_INT((int)window.dropped(), 1);
}

RETRAINER_TEST(the_general_description_handles_numbers, "cpp.types.templates") {
    RETRAINER_ASSERT_STR(describe(42), "42");
    RETRAINER_ASSERT_STR(describe(-7), "-7");
}

RETRAINER_TEST(bool_and_string_describe_themselves_properly, "cpp.types.templates") {
    RETRAINER_ASSERT_STR(describe(true), "true");
    RETRAINER_ASSERT_STR(describe(false), "false");
    RETRAINER_ASSERT_STR(describe(std::string("hello")), "'hello'");
}
