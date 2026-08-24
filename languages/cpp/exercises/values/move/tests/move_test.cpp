// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <utility>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(a_new_buffer_holds_its_size, "cpp.values.move") {
    Buffer::reset();
    Buffer buffer(64);

    RETRAINER_ASSERT_INT((int)buffer.size(), 64);
    RETRAINER_ASSERT(!buffer.empty(), "a sized buffer is not empty");
    // Constructing is neither a copy nor a move.
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 0);
    RETRAINER_ASSERT_INT(Buffer::stats().moves, 0);
}

RETRAINER_TEST(copying_copies, "cpp.values.move") {
    Buffer::reset();
    Buffer original(32);
    Buffer copy(original);

    RETRAINER_ASSERT_INT((int)copy.size(), 32);
    // The original survives a copy intact. That is the whole difference.
    RETRAINER_ASSERT_INT((int)original.size(), 32);
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 1);
    RETRAINER_ASSERT_INT(Buffer::stats().moves, 0);
}

RETRAINER_TEST(moving_moves, "cpp.values.move") {
    Buffer::reset();
    Buffer original(32);
    Buffer moved(std::move(original));

    RETRAINER_ASSERT_INT((int)moved.size(), 32);
    RETRAINER_ASSERT_INT(Buffer::stats().moves, 1);
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 0);
}

RETRAINER_TEST(a_moved_from_buffer_is_empty_and_safe, "cpp.lifetime.rule") {
    Buffer::reset();
    Buffer original(32);
    Buffer moved(std::move(original));

    // Valid but unspecified is the standard's promise; leaving it empty is
    // what makes it valid. Leaving the pointer behind would free it twice.
    RETRAINER_ASSERT_INT((int)original.size(), 0);  // NOLINT
    RETRAINER_ASSERT(original.empty(), "the source is left empty");
}

RETRAINER_TEST(copy_assignment_copies, "cpp.values.move") {
    Buffer::reset();
    Buffer first(16);
    Buffer second(8);
    second = first;

    RETRAINER_ASSERT_INT((int)second.size(), 16);
    RETRAINER_ASSERT_INT((int)first.size(), 16);
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 1);
}

RETRAINER_TEST(move_assignment_moves, "cpp.values.move") {
    Buffer::reset();
    Buffer first(16);
    Buffer second(8);
    second = std::move(first);

    RETRAINER_ASSERT_INT((int)second.size(), 16);
    RETRAINER_ASSERT_INT(Buffer::stats().moves, 1);
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 0);
}

RETRAINER_TEST(duplicate_makes_a_copy_on_purpose, "cpp.values.const") {
    Buffer::reset();
    Buffer original(20);
    Buffer other = duplicate(original);

    RETRAINER_ASSERT_INT((int)other.size(), 20);
    RETRAINER_ASSERT_INT((int)original.size(), 20);
    RETRAINER_ASSERT_INT(Buffer::stats().copies, 1);
}
