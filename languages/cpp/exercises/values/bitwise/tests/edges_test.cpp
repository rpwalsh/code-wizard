// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include <string>

#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(adding_the_same_permission_twice_changes_nothing, "cpp.values.bitwise") {
    // OR is idempotent, which is what makes a bitset a set rather than a
    // tally. Adding read to a set that has it is not two reads.
    const Permission once = with(Permission::none, Permission::read);
    const Permission twice = with(once, Permission::read);
    RETRAINER_ASSERT_STR(describe(twice), describe(once));
    RETRAINER_ASSERT_INT(count(twice), 1);
}

RETRAINER_TEST(removing_a_permission_that_is_absent_changes_nothing,
               "cpp.values.bitwise") {
    const Permission set = with(Permission::none, Permission::read);
    const Permission after = without(set, Permission::write);
    RETRAINER_ASSERT_STR(describe(after), "r--");
}

RETRAINER_TEST(removing_a_permission_twice_changes_nothing, "cpp.values.bitwise") {
    const Permission once = without(Permission::all, Permission::write);
    const Permission twice = without(once, Permission::write);
    RETRAINER_ASSERT_STR(describe(twice), "r-x");
}

RETRAINER_TEST(removing_everything_leaves_nothing, "cpp.values.bitwise") {
    RETRAINER_ASSERT_STR(describe(without(Permission::all, Permission::all)), "---");
    RETRAINER_ASSERT_INT(count(without(Permission::all, Permission::all)), 0);
}

RETRAINER_TEST(adding_everything_gives_everything, "cpp.values.bitwise") {
    RETRAINER_ASSERT_STR(describe(with(Permission::none, Permission::all)), "rwx");
    RETRAINER_ASSERT_INT(count(with(Permission::read, Permission::all)), 3);
}

RETRAINER_TEST(every_set_has_all_of_nothing, "cpp.values.bitwise") {
    // Vacuously, and it matters: `has` asks whether every named bit is
    // present, and none names no bits at all.
    RETRAINER_ASSERT(has(Permission::none, Permission::none), "nothing has nothing");
    RETRAINER_ASSERT(has(Permission::all, Permission::none), "everything has nothing");
}

RETRAINER_TEST(no_set_has_any_of_nothing, "cpp.values.bitwise") {
    // The mirror image, and it goes the other way. There is no bit in
    // common with a set that names no bits.
    RETRAINER_ASSERT(!has_any(Permission::all, Permission::none), "no bits in common");
    RETRAINER_ASSERT(!has_any(Permission::none, Permission::all), "and none the other way");
}

RETRAINER_TEST(the_empty_set_has_none_of_anything, "cpp.values.bitwise") {
    RETRAINER_ASSERT(!has(Permission::none, Permission::read), "nothing has read");
    RETRAINER_ASSERT(!has_any(Permission::none, Permission::all), "nor any of the three");
}

RETRAINER_TEST(all_contains_each_permission_separately, "cpp.values.bitwise") {
    RETRAINER_ASSERT(has(Permission::all, Permission::read), "read");
    RETRAINER_ASSERT(has(Permission::all, Permission::write), "write");
    RETRAINER_ASSERT(has(Permission::all, Permission::execute), "execute");
    RETRAINER_ASSERT(has(Permission::all, Permission::all), "and all of them at once");
}

RETRAINER_TEST(each_position_in_the_description_is_its_own, "cpp.values.bitwise") {
    // Three separate letters in three fixed places. Building the string by
    // appending only what is present would slide the letters left.
    RETRAINER_ASSERT_STR(describe(Permission::read), "r--");
    RETRAINER_ASSERT_STR(describe(Permission::write), "-w-");
    RETRAINER_ASSERT_STR(describe(Permission::execute), "--x");
    RETRAINER_ASSERT_STR(describe(with(Permission::write, Permission::execute)), "-wx");
}

RETRAINER_TEST(removing_one_leaves_the_others_alone, "cpp.values.bitwise") {
    RETRAINER_ASSERT_STR(describe(without(Permission::all, Permission::read)), "-wx");
    RETRAINER_ASSERT_STR(describe(without(Permission::all, Permission::execute)), "rw-");
}

RETRAINER_TEST(counting_matches_the_description, "cpp.values.bitwise") {
    const Permission sets[] = {
        Permission::none,
        Permission::read,
        with(Permission::read, Permission::write),
        Permission::all,
    };
    const int expected[] = {0, 1, 2, 3};
    for (int index = 0; index < 4; index += 1) {
        RETRAINER_ASSERT_INT(count(sets[index]), expected[index]);
    }
}
