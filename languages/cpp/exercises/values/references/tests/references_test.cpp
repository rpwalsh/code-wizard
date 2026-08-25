// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_counter_can_be_changed_through_what_comes_back, "cpp.lifetime.references") {
    // The test a returned copy cannot pass. If counter_for handed back a
    // Counter by value, this would raise a temporary and the map would still
    // read zero.
    Counters counters;
    counter_for(counters, "alpha").hits = 5;
    RETRAINER_ASSERT_INT(total_hits(counters), 5);
}

RETRAINER_TEST(a_new_name_starts_at_zero, "cpp.lifetime.references") {
    Counters counters;
    RETRAINER_ASSERT_INT(counter_for(counters, "fresh").hits, 0);
}

RETRAINER_TEST(the_same_name_gives_the_same_counter, "cpp.lifetime.references") {
    Counters counters;
    Counter &first = counter_for(counters, "alpha");
    Counter &again = counter_for(counters, "alpha");
    RETRAINER_ASSERT(&first == &again, "one name, one counter");
}

RETRAINER_TEST(a_missing_counter_is_a_null_pointer, "cpp.lifetime.references") {
    Counters counters;
    counter_for(counters, "alpha");
    RETRAINER_ASSERT(find_counter(counters, "missing") == nullptr, "no such counter");
    RETRAINER_ASSERT(find_counter(counters, "alpha") != nullptr, "this one is there");
}

RETRAINER_TEST(bumping_raises_every_counter, "cpp.lifetime.references") {
    Counters counters;
    counter_for(counters, "a").hits = 1;
    counter_for(counters, "b").hits = 10;

    bump_all(counters);
    RETRAINER_ASSERT_INT(total_hits(counters), 13);
}

RETRAINER_TEST(the_larger_value_comes_back_as_itself, "cpp.lifetime.references") {
    int small = 3;
    int big = 9;
    const int &winner = larger(small, big);

    RETRAINER_ASSERT_INT(winner, 9);
    RETRAINER_ASSERT(&winner == &big, "the caller's own variable, not a copy");
}

RETRAINER_TEST(two_values_can_be_exchanged, "cpp.lifetime.references") {
    int left = 1;
    int right = 2;
    exchange(left, right);
    RETRAINER_ASSERT_INT(left, 2);
    RETRAINER_ASSERT_INT(right, 1);
}
