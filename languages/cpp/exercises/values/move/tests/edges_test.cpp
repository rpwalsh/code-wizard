// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <utility>
#include <vector>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(self_assignment_does_not_destroy_the_object, "cpp.lifetime.rule") {
    Buffer::reset();
    Buffer buffer(24);

    // `buffer = buffer` through a reference. Without the guard the copy
    // assignment frees the memory it is about to read from.
    Buffer &alias = buffer;
    buffer = alias;

    RETRAINER_ASSERT_INT((int)buffer.size(), 24);
}

RETRAINER_TEST(self_move_leaves_the_object_usable, "cpp.lifetime.rule") {
    Buffer::reset();
    Buffer buffer(24);

    Buffer &alias = buffer;
    buffer = std::move(alias);

    // Not required to keep its contents, but required not to be a crash and
    // not to have been freed twice.
    RETRAINER_ASSERT(buffer.size() == 24 || buffer.size() == 0, "still a valid object");
}

RETRAINER_TEST(move_assignment_also_empties_its_source, "cpp.lifetime.rule") {
    // The constructor and the assignment operator both have to leave the
    // source safe to destroy. Getting one right and not the other frees the
    // block twice, and only the untested half shows it.
    Buffer::reset();
    Buffer first(40);
    Buffer second(8);
    second = std::move(first);

    RETRAINER_ASSERT_INT((int)first.size(), 0);  // NOLINT
    RETRAINER_ASSERT(first.empty(), "the assigned-from source is left empty");
    RETRAINER_ASSERT_INT((int)second.size(), 40);
}

RETRAINER_TEST(taking_by_value_moves_rather_than_copies, "cpp.values.move") {
    Buffer::reset();
    Buffer original(48);

    Buffer result = take(std::move(original));

    RETRAINER_ASSERT_INT((int)result.size(), 48);
    // Two moves: into the parameter, then out of it. No copy anywhere.
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 0);
    RETRAINER_ASSERT(Buffer::stats().moves >= 1, "the value was moved, not copied");
}

RETRAINER_TEST(taking_a_named_object_without_move_copies_it, "cpp.values.move") {
    Buffer::reset();
    Buffer original(48);

    Buffer result = take(original);

    // Passing a named object copies it into the parameter, because a name
    // is an lvalue however it is used. This is the cost std::move removes.
    RETRAINER_ASSERT_INT((int)result.size(), 48);
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 1);
    RETRAINER_ASSERT_INT((int)original.size(), 48);
}

RETRAINER_TEST(an_empty_buffer_is_legal, "cpp.values.move") {
    Buffer::reset();
    Buffer buffer(0);

    RETRAINER_ASSERT(buffer.empty(), "zero bytes is a valid size");
    Buffer moved(std::move(buffer));
    RETRAINER_ASSERT(moved.empty(), "an empty buffer moves like any other");
}

RETRAINER_TEST(collecting_reserves_so_growth_copies_nothing, "cpp.std.containers") {
    Buffer::reset();
    std::vector<Buffer> buffers = collect(16, 8);

    RETRAINER_ASSERT_INT((int)buffers.size(), 16);
    if (buffers.empty()) return;  // a stub returns nothing; do not index it
    RETRAINER_ASSERT_INT((int)buffers[0].size(), 8);
    // Without reserve the vector reallocates several times on the way to
    // sixteen, moving everything it already held each time.
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 0);
    RETRAINER_ASSERT_INT(Buffer::stats().moves, 0);
}

RETRAINER_TEST(collecting_nothing_is_an_empty_vector, "cpp.std.containers") {
    Buffer::reset();
    std::vector<Buffer> buffers = collect(0, 8);
    RETRAINER_ASSERT_INT((int)buffers.size(), 0);
}
