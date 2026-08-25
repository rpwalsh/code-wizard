// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(looking_for_a_counter_does_not_create_one, "cpp.lifetime.references") {
    // find_counter takes a const reference, so operator[] is not even
    // available to it. That is const-correctness catching the bug for you.
    Counters counters;
    counter_for(counters, "alpha");

    find_counter(counters, "ghost");
    find_counter(counters, "ghost");

    RETRAINER_ASSERT_INT((int)counters.size(), 1);
}

RETRAINER_TEST(the_pointer_found_points_at_the_counter_itself, "cpp.lifetime.references") {
    Counters counters;
    Counter &alpha = counter_for(counters, "alpha");
    alpha.hits = 7;

    const Counter *found = find_counter(counters, "alpha");
    RETRAINER_ASSERT(found != nullptr, "the counter is there");
    if (found == nullptr) return;
    RETRAINER_ASSERT(found == &alpha, "and it is that one, not a copy");
    RETRAINER_ASSERT_INT(found->hits, 7);
}

RETRAINER_TEST(a_tie_gives_back_the_left_one, "cpp.lifetime.references") {
    // Two variables holding the same number are still two variables, and
    // which one comes back is observable.
    int left = 5;
    int right = 5;
    const int &winner = larger(left, right);
    RETRAINER_ASSERT(&winner == &left, "ties go left");
}

RETRAINER_TEST(the_larger_is_found_on_either_side, "cpp.lifetime.references") {
    int left = 9;
    int right = 3;
    RETRAINER_ASSERT(&larger(left, right) == &left, "larger on the left");
    RETRAINER_ASSERT(&larger(right, left) == &left, "and still found on the right");
}

RETRAINER_TEST(negative_values_compare_properly, "cpp.lifetime.references") {
    int low = -10;
    int high = -2;
    RETRAINER_ASSERT_INT(larger(low, high), -2);
    RETRAINER_ASSERT(&larger(low, high) == &high, "minus two is the larger");
}

RETRAINER_TEST(exchanging_a_value_with_itself_leaves_it_alone, "cpp.lifetime.references") {
    // Both references name the same object. A swap written through a
    // temporary survives this; one written as two assignments does not.
    int only = 42;
    exchange(only, only);
    RETRAINER_ASSERT_INT(only, 42);
}

RETRAINER_TEST(exchanging_negatives_and_zero_works, "cpp.lifetime.references") {
    int left = 0;
    int right = -7;
    exchange(left, right);
    RETRAINER_ASSERT_INT(left, -7);
    RETRAINER_ASSERT_INT(right, 0);
}

RETRAINER_TEST(bumping_an_empty_map_does_nothing, "cpp.lifetime.references") {
    Counters counters;
    bump_all(counters);
    RETRAINER_ASSERT_INT((int)counters.size(), 0);
    RETRAINER_ASSERT_INT(total_hits(counters), 0);
}

RETRAINER_TEST(bumping_twice_adds_two, "cpp.lifetime.references") {
    Counters counters;
    counter_for(counters, "a");
    bump_all(counters);
    bump_all(counters);
    RETRAINER_ASSERT_INT(total_hits(counters), 2);
}

RETRAINER_TEST(a_reference_held_across_a_bump_sees_the_change,
               "cpp.lifetime.references") {
    // A reference is not a snapshot. It names the object, so it reads
    // whatever the object holds now — which is the point, and the reason a
    // reference outliving its object is so dangerous.
    Counters counters;
    Counter &alpha = counter_for(counters, "alpha");
    RETRAINER_ASSERT_INT(alpha.hits, 0);

    bump_all(counters);
    RETRAINER_ASSERT_INT(alpha.hits, 1);
}

RETRAINER_TEST(counters_with_no_hits_still_count_as_counters,
               "cpp.lifetime.references") {
    Counters counters;
    counter_for(counters, "quiet");
    RETRAINER_ASSERT_INT((int)counters.size(), 1);
    RETRAINER_ASSERT_INT(total_hits(counters), 0);
    RETRAINER_ASSERT(find_counter(counters, "quiet") != nullptr, "present at zero");
}
