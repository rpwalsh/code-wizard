// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(an_untouched_buffer_holds_nothing, "cpp.types.templates") {
    RingBuffer<int, 4> window;
    RETRAINER_ASSERT_INT((int)window.size(), 0);
    RETRAINER_ASSERT(!window.full(), "empty is not full");
    RETRAINER_ASSERT_INT((int)window.drain().size(), 0);
}

RETRAINER_TEST(a_buffer_of_one_keeps_only_the_newest, "cpp.types.templates") {
    // Capacity one is where an off-by-one in the wrap shows up immediately.
    RingBuffer<int, 1> latest;
    latest.push(1);
    RETRAINER_ASSERT_INT(latest.oldest(), 1);
    RETRAINER_ASSERT(latest.full(), "one of one is full");

    latest.push(2);
    RETRAINER_ASSERT_INT((int)latest.size(), 1);
    RETRAINER_ASSERT_INT(latest.oldest(), 2);
    RETRAINER_ASSERT_INT((int)latest.dropped(), 1);
}

RETRAINER_TEST(the_wrap_survives_going_round_several_times, "cpp.types.templates") {
    RingBuffer<int, 3> window;
    for (int value = 1; value <= 20; value += 1) {
        window.push(value);
    }

    const std::vector<int> held = window.drain();
    RETRAINER_ASSERT_INT((int)held.size(), 3);
    if (held.size() < 3) return;
    RETRAINER_ASSERT_INT(held[0], 18);
    RETRAINER_ASSERT_INT(held[1], 19);
    RETRAINER_ASSERT_INT(held[2], 20);
}

RETRAINER_TEST(a_buffer_can_be_refilled_after_draining, "cpp.types.templates") {
    // Draining resets where the window sits. If it only zeroed the count and
    // left the read position where it was, this comes back in the wrong order.
    RingBuffer<int, 3> window;
    window.push(1);
    window.push(2);
    window.push(3);
    window.push(4);
    window.drain();

    window.push(7);
    window.push(8);
    const std::vector<int> held = window.drain();
    RETRAINER_ASSERT_INT((int)held.size(), 2);
    if (held.size() < 2) return;
    RETRAINER_ASSERT_INT(held[0], 7);
    RETRAINER_ASSERT_INT(held[1], 8);
}

RETRAINER_TEST(the_dropped_count_survives_a_drain, "cpp.types.templates") {
    // What was lost was lost. Draining is reading, not forgiveness.
    RingBuffer<int, 2> window;
    window.push(1);
    window.push(2);
    window.push(3);
    window.drain();
    RETRAINER_ASSERT_INT((int)window.dropped(), 1);
}

RETRAINER_TEST(two_capacities_are_two_different_types, "cpp.types.templates") {
    // RingBuffer<int, 2> and RingBuffer<int, 8> share source and nothing
    // else. The compiler produces two classes with two sets of storage.
    RingBuffer<int, 2> small;
    RingBuffer<int, 8> large;
    for (int value = 1; value <= 5; value += 1) {
        small.push(value);
        large.push(value);
    }

    RETRAINER_ASSERT_INT((int)small.size(), 2);
    RETRAINER_ASSERT_INT((int)large.size(), 5);
    RETRAINER_ASSERT_INT((int)small.dropped(), 3);
    RETRAINER_ASSERT_INT((int)large.dropped(), 0);
}

RETRAINER_TEST(a_bool_is_not_described_as_a_number, "cpp.types.templates") {
    // The general template compiles perfectly well for bool and returns "1",
    // which is why this specialization exists and why nothing warns without it.
    RETRAINER_ASSERT_STR(describe(true), "true");
}

RETRAINER_TEST(an_empty_string_is_still_quoted, "cpp.types.templates") {
    RETRAINER_ASSERT_STR(describe(std::string()), "''");
}

RETRAINER_TEST(a_long_is_described_by_the_general_template, "cpp.types.templates") {
    const long big = 1234567;
    RETRAINER_ASSERT_STR(describe(big), "1234567");
}
