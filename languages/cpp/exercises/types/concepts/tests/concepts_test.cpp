// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "retrainer.hpp"
#include "main.hpp"

RETRAINER_TEST(averages_ints_and_doubles, "cpp.types.templates") {
    RETRAINER_ASSERT_INT(average(std::vector<int>{2, 4, 6}), 4);
    RETRAINER_ASSERT_NEAR(average(std::vector<double>{1.0, 2.0, 4.0}), 2.3333, 0.001);
}

// A user-defined type that satisfies Averageable: the concept's whole point.
struct Money {
    int cents = 0;
    Money operator+(const Money &other) const { return {cents + other.cents}; }
    Money operator/(int divisor) const { return {cents / divisor}; }
    bool operator==(const Money &other) const = default;
};

RETRAINER_TEST(averages_a_user_type_meeting_the_concept, "cpp.types.concepts") {
    std::vector<Money> prices{{100}, {300}};
    RETRAINER_ASSERT_INT(average(prices).cents, 200);
}

RETRAINER_TEST(keep_if_filters_with_a_lambda, "cpp.types.templates") {
    auto evens = keep_if(std::vector<int>{1, 2, 3, 4, 5, 6},
                         [](int n) { return n % 2 == 0; });
    RETRAINER_ASSERT_INT(static_cast<int>(evens.size()), 3);
    RETRAINER_ASSERT_INT(evens[0], 2);
    RETRAINER_ASSERT_INT(evens[2], 6);
}

struct Tag {
    std::string name;
    std::string describe() const { return "#" + name; }
};

RETRAINER_TEST(join_walks_the_describable, "cpp.types.concepts") {
    std::vector<Tag> tags{{"cpp"}, {"templates"}};
    // Bound to a local: c_str() on a temporary dangles once the full
    // expression ends, and the assertion macro reads it after that.
    const std::string joined = join_descriptions(tags);
    RETRAINER_ASSERT_STR(joined.c_str(), "#cpp, #templates");
}
